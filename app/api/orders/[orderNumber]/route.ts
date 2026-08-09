import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/logger';

export async function GET(
  req: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const orderNumber = params.orderNumber ? decodeURIComponent(params.orderNumber).trim() : '';

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    const supabase = getSupabaseServerClient(token);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      logAudit('api_fetch_order_db_error', 'error', { orderNumber, error: error.message });
      return NextResponse.json({ error: 'Failed to query order database.' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    logAudit('api_fetch_order_route_error', 'error', { error: err?.message || 'Server error' });
    return NextResponse.json({ error: err?.message || 'Unexpected server error.' }, { status: 500 });
  }
}
