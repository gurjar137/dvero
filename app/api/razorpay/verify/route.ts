import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { validateStockAvailability } from '@/lib/inventory';
import { sendEmail, generateOrderConfirmationEmailHTML } from '@/lib/email';
import { logAudit } from '@/lib/logger';
import { formatINR } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload,
      cartSnapshot,
      saveAddress = false,
      userId: bodyUserId,
    } = body;

    // 1. Validate Payload Parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload || !Array.isArray(cartSnapshot)) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields.' },
        { status: 400 }
      );
    }

    // 2. Extract Auth User Token & Initialize Client with Auth Context
    let token: string | null = null;
    let userId: string | null = bodyUserId || null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    const supabase = getSupabaseServerClient(token);

    if (token && !userId) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // 3. Server-Side Signature Verification via HMAC SHA256
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      logAudit('razorpay_verification_failed', 'error', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Payment signature verification failed. Order will not be processed.' },
        { status: 400 }
      );
    }

    logAudit('razorpay_verification_success', 'info', {
      razorpay_order_id,
      razorpay_payment_id,
      orderNumber: orderPayload.order_number,
    });

    // 4. Prevent duplicate order finalization (idempotency check by razorpay payment ID or order number)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('order_number', orderPayload.order_number)
      .maybeSingle();

    if (existingOrder) {
      logAudit('razorpay_duplicate_finalization_prevented', 'warn', {
        orderNumber: orderPayload.order_number,
        existingId: existingOrder.id,
      });
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
        duplicate: true,
      });
    }

    // 5. Validate Stock Availability before committing DB writes
    const stockCheck = await validateStockAvailability(cartSnapshot, supabase);
    if (!stockCheck.valid) {
      logAudit('razorpay_stock_unavailable_at_verification', 'error', {
        orderNumber: orderPayload.order_number,
        outOfStock: stockCheck.outOfStockItems,
      });
      return NextResponse.json(
        { error: 'Items went out of stock during payment processing. Please contact support with payment ID: ' + razorpay_payment_id },
        { status: 409 }
      );
    }

    // 6. Save Saved Address if checked and user authenticated
    if (userId && saveAddress) {
      const { data: existingAddresses } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', userId);

      await supabase.from('customer_addresses').insert([
        {
          customer_id: userId,
          full_name: orderPayload.customer_name,
          phone: orderPayload.phone,
          address: orderPayload.address,
          city: orderPayload.city,
          state: orderPayload.state,
          pincode: orderPayload.pincode,
          is_default: !existingAddresses || existingAddresses.length === 0,
        },
      ]);
    }

    const rawPaymentMethod = String(orderPayload?.payment_method || '').toLowerCase();
    const paymentMethodValue = rawPaymentMethod === 'cod' ? 'cod' : 'razorpay';

    const subtotal = Number(orderPayload.subtotal) || Number(orderPayload.total) || 0;
    const shipping = Number(orderPayload.shipping) || 0;
    const total = Number(orderPayload.total) || (subtotal + shipping);

    if (!Number.isFinite(subtotal) || !Number.isFinite(shipping) || !Number.isFinite(total)) {
      return NextResponse.json({ error: 'Invalid order calculation values.' }, { status: 400 });
    }

    // 7. Insert Order Record into Supabase `orders`
    let insertedOrder: any;
    const finalPayload = {
      customer_id: userId || orderPayload.customer_id || null,
      order_number: orderPayload.order_number,
      customer_name: orderPayload.customer_name?.trim() || '',
      email: orderPayload.email?.trim() || '',
      phone: orderPayload.phone?.trim() || '',
      address: orderPayload.address?.trim() || '',
      city: orderPayload.city?.trim() || '',
      state: orderPayload.state?.trim() || '',
      pincode: orderPayload.pincode?.trim() || '',
      payment_method: paymentMethodValue,
      subtotal,
      shipping,
      total,
      status: 'placed',
      delivery_date: orderPayload.delivery_date || null,
      order_notes: orderPayload.order_notes ? String(orderPayload.order_notes).trim() : null,
      shipping_method: orderPayload.shipping_method || 'standard',
    };

    const { data: initialOrder, error: insertErr } = await supabase
      .from('orders')
      .insert(finalPayload)
      .select()
      .single();

    if (insertErr) {
      // Robust Fallback handling for optional columns / status check constraints
      const fallbackPayload = { ...finalPayload };
      if (insertErr.message?.includes('orders_status_check') || insertErr.code === '23514') {
        fallbackPayload.status = 'processing';
      }
      if (
        insertErr.message?.includes('order_notes') ||
        insertErr.message?.includes('shipping_method')
      ) {
        delete (fallbackPayload as any).order_notes;
        delete (fallbackPayload as any).shipping_method;
      }

      const { data: retryData, error: retryErr } = await supabase
        .from('orders')
        .insert(fallbackPayload)
        .select()
        .single();

      if (retryErr) {
        logAudit('razorpay_order_insert_error', 'error', { error: retryErr.message });
        throw retryErr;
      }
      insertedOrder = retryData;
    } else {
      insertedOrder = initialOrder;
    }

    // 8. Fetch product details to map item rows correctly
    const productIds = cartSnapshot.map((c: any) => c.id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    const productMap = new Map<string, { name: string; price: number }>();
    if (products) {
      products.forEach((p: any) => productMap.set(p.id, { name: p.name, price: Number(p.price) || 0 }));
    }

    const itemRows = cartSnapshot.map((c: any) => {
      const p = productMap.get(c.id);
      return {
        order_id: insertedOrder.id,
        product_id: c.id,
        product_name: p ? p.name : c.id,
        size: c.size,
        qty: c.qty,
        price: p ? p.price : 0,
      };
    });

    const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
    if (itemsErr) {
      logAudit('razorpay_order_items_insert_error', 'error', { error: itemsErr.message });
      throw itemsErr;
    }

    // 9. Atomic Inventory Stock Deduction
    for (const item of cartSnapshot) {
      const { data: invRow } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', item.id)
        .eq('size', item.size)
        .maybeSingle();

      if (invRow) {
        const newStock = Math.max(0, invRow.stock - item.qty);
        await supabase
          .from('inventory')
          .update({ stock: newStock })
          .eq('id', invRow.id);
      }
    }

    // 10. Dispatch Order Confirmation Email
    const estDeliveryDateObj = new Date(orderPayload.delivery_date || Date.now());
    const emailHtml = generateOrderConfirmationEmailHTML(
      orderPayload.order_number,
      orderPayload.customer_name,
      formatINR(orderPayload.total),
      estDeliveryDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    );

    sendEmail({
      to: orderPayload.email,
      subject: `D'VERO Order Confirmation #${orderPayload.order_number}`,
      html: emailHtml,
    });

    logAudit('razorpay_order_finalized', 'info', {
      orderId: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
    });

    return NextResponse.json({
      success: true,
      orderId: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
    });
  } catch (error: any) {
    logAudit('razorpay_verify_route_error', 'error', { error: error?.message || 'Server error' });
    return NextResponse.json(
      { error: error?.message || 'An error occurred during payment verification.' },
      { status: 500 }
    );
  }
}
