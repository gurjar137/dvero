import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber } = body;

    const cleanOrderNumber = orderNumber ? String(orderNumber).trim() : '';

    if (!cleanOrderNumber) {
      return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    const supabase = getSupabaseServerClient(token);

    // 1. Fetch Order Record
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', cleanOrderNumber)
      .maybeSingle();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 2. Validate Order Status
    if (order.status === 'cancelled') {
      return NextResponse.json({ success: true, message: 'Order is already cancelled.', order });
    }

    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Delivered orders cannot be cancelled. Please initiate a return or exchange.' },
        { status: 400 }
      );
    }

    // 3. Update Order Status to 'cancelled' in Supabase
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      logAudit('order_cancel_update_error', 'error', { orderNumber: cleanOrderNumber, error: updateErr.message });
      return NextResponse.json({ error: 'Failed to cancel order in database.' }, { status: 500 });
    }

    // 4. Restore Inventory Stock for Cancelled Items
    if (order.order_items && Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (!item.product_id || !item.size || !item.qty) continue;
        const { data: invRow } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_id', item.product_id)
          .eq('size', item.size)
          .maybeSingle();

        if (invRow) {
          await supabase
            .from('inventory')
            .update({ stock: invRow.stock + Number(item.qty) })
            .eq('id', invRow.id);
        }
      }
    }

    logAudit('order_cancelled_successfully', 'info', { orderNumber: cleanOrderNumber, orderId: order.id });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully.',
      order: updatedOrder,
    });
  } catch (err: any) {
    logAudit('order_cancel_route_error', 'error', { error: err?.message || 'Server error' });
    return NextResponse.json({ error: err?.message || 'Unexpected server error.' }, { status: 500 });
  }
}
