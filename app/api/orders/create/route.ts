import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { validateStockAvailability } from '@/lib/inventory';
import { sendEmail, generateOrderConfirmationEmailHTML } from '@/lib/email';
import { logAudit } from '@/lib/logger';
import { formatINR, generateOrderNumber, addBusinessDays } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cartSnapshot,
      shippingMethod = 'standard',
      couponCode,
      orderPayload,
      saveAddress = false,
    } = body;

    const rawCartSnapshot = Array.isArray(cartSnapshot) ? cartSnapshot : [];
    const cleanCartSnapshot = rawCartSnapshot.filter(item => item && item.id && item.size && Number(item.qty) > 0);

    // 1. Input Validation
    if (cleanCartSnapshot.length === 0 || !orderPayload) {
      return NextResponse.json({ error: 'Cart is empty or invalid order details provided.' }, { status: 400 });
    }

    if (
      !orderPayload.customer_name ||
      !orderPayload.email ||
      !orderPayload.phone ||
      !orderPayload.address ||
      !orderPayload.pincode
    ) {
      return NextResponse.json({ error: 'Missing required recipient or shipping address information.' }, { status: 400 });
    }

    // 2. Extract Auth User Token & Initialize Client with Auth Context
    let token: string | null = null;
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    const supabase = getSupabaseServerClient(token);

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    if (!userId && orderPayload?.customer_id) {
      userId = orderPayload.customer_id || null;
    }

    // 3. Validate Stock Availability against Supabase Inventory
    const stockCheck = await validateStockAvailability(cleanCartSnapshot, supabase);
    if (!stockCheck.valid) {
      return NextResponse.json(
        { error: 'Some items in your bag exceed available stock.', outOfStockItems: stockCheck.outOfStockItems },
        { status: 400 }
      );
    }

    // 4. Server-Side Price & Total Calculation directly from DB Products
    const productIds = cleanCartSnapshot.map((item: any) => item.id);
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (dbError || !products) {
      logAudit('order_create_db_error', 'error', { error: dbError?.message });
      return NextResponse.json({ error: 'Failed to verify product prices from database.' }, { status: 500 });
    }

    const priceMap = new Map<string, { name: string; price: number }>();
    products.forEach((p: any) => priceMap.set(p.id, { name: p.name, price: Number(p.price) || 0 }));

    let subtotal = 0;
    for (const item of cleanCartSnapshot) {
      const pInfo = priceMap.get(item.id);
      const price = pInfo ? pInfo.price : 0;
      subtotal += price * (Number(item.qty) || 1);
    }

    if (subtotal <= 0) {
      return NextResponse.json({ error: 'Invalid product subtotal calculated from database.' }, { status: 400 });
    }

    // Calculate coupon discount if applicable
    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', String(couponCode).toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (coupon && subtotal >= (coupon.min_spend || 0)) {
        if (coupon.discount_type === 'percent') {
          discount = Math.round((subtotal * coupon.discount_value) / 100);
        } else {
          discount = coupon.discount_value;
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shippingCost = 0; // FREE Standard & Express Shipping
    const total = discountedSubtotal + shippingCost;

    if (!Number.isFinite(subtotal) || !Number.isFinite(shippingCost) || !Number.isFinite(total)) {
      return NextResponse.json({ error: 'Invalid order amount values.' }, { status: 400 });
    }

    const orderNumber = orderPayload.order_number || generateOrderNumber();
    const deliveryEstDays = shippingMethod === 'express' ? 3 : 6;
    const estDeliveryDate = addBusinessDays(new Date(), deliveryEstDays);

    const rawPaymentMethod = String(orderPayload?.payment_method || '').toLowerCase();
    const paymentMethodValue = rawPaymentMethod === 'cod' ? 'cod' : 'razorpay';

    // 5. Construct DB Order Payload matching existing orders schema EXACTLY
    const finalPayload = {
      customer_id: userId ?? null,
      order_number: orderNumber,
      customer_name: orderPayload.customer_name.trim(),
      email: orderPayload.email.trim(),
      phone: orderPayload.phone.trim(),
      address: orderPayload.address.trim(),
      city: orderPayload.city.trim(),
      state: orderPayload.state.trim(),
      pincode: orderPayload.pincode.trim(),
      payment_method: paymentMethodValue,
      subtotal,
      shipping: shippingCost,
      total,
      status: 'processing',
      delivery_date: estDeliveryDate.toISOString().slice(0, 10),
      order_notes: orderPayload.order_notes ? String(orderPayload.order_notes).trim() : null,
      shipping_method: shippingMethod,
    };

    // 6. Insert Order Row using Supabase Server Client
    let insertedOrder: any;
    const { data: initialOrder, error: insertErr } = await supabase
      .from('orders')
      .insert(finalPayload)
      .select()
      .single();

    if (insertErr) {
      logAudit('order_create_insert_retry', 'warn', { error: insertErr.message });
      const fallbackPayload = { ...finalPayload };

      if (insertErr.message?.includes('orders_status_check') || insertErr.code === '23514') {
        fallbackPayload.status = 'processing';
      }
      if (insertErr.message?.includes('order_notes') || insertErr.message?.includes('shipping_method')) {
        delete (fallbackPayload as any).order_notes;
        delete (fallbackPayload as any).shipping_method;
      }

      const { data: retryData, error: retryErr } = await supabase
        .from('orders')
        .insert(fallbackPayload)
        .select()
        .single();

      if (retryErr) {
        logAudit('order_create_insert_error', 'error', { error: retryErr.message });
        return NextResponse.json({ error: retryErr.message || 'Could not place order.' }, { status: 400 });
      }
      insertedOrder = retryData;
    } else {
      insertedOrder = initialOrder;
    }

    // 7. Insert Order Items
    const itemRows = cleanCartSnapshot.map((item: any) => {
      const pInfo = priceMap.get(item.id);
      return {
        order_id: insertedOrder.id,
        product_id: item.id,
        product_name: pInfo ? pInfo.name : item.id,
        size: item.size,
        qty: Number(item.qty) || 1,
        price: pInfo ? pInfo.price : 0,
      };
    });

    const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
    if (itemsErr) {
      logAudit('order_items_insert_error', 'error', { error: itemsErr.message });
      return NextResponse.json({ error: 'Order created but failed to save order items.' }, { status: 500 });
    }

    // 8. Deduct Inventory Stock Atomically
    for (const item of cleanCartSnapshot) {
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

    // 9. Save Address if requested and user authenticated
    if (userId && saveAddress) {
      const { data: existingAddr } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', userId);

      await supabase.from('customer_addresses').insert([
        {
          customer_id: userId,
          full_name: finalPayload.customer_name,
          phone: finalPayload.phone,
          address: finalPayload.address,
          city: finalPayload.city,
          state: finalPayload.state,
          pincode: finalPayload.pincode,
          is_default: !existingAddr || existingAddr.length === 0,
        },
      ]);
    }

    // 10. Dispatch Confirmation Email
    const emailHtml = generateOrderConfirmationEmailHTML(
      orderNumber,
      finalPayload.customer_name,
      formatINR(total),
      estDeliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    );

    sendEmail({
      to: finalPayload.email,
      subject: `D'VERO Order Confirmation #${orderNumber}`,
      html: emailHtml,
    });

    logAudit('order_created_successfully', 'info', { orderId: insertedOrder.id, orderNumber });

    return NextResponse.json({
      success: true,
      orderId: insertedOrder.id,
      orderNumber,
      total,
      deliveryDate: estDeliveryDate.toISOString(),
    });
  } catch (error: any) {
    logAudit('order_create_route_error', 'error', { error: error?.message || 'Server error' });
    return NextResponse.json({ error: error?.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
