import { NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import { supabaseServer } from '@/lib/supabase/server';
import { validateStockAvailability } from '@/lib/inventory';
import { logAudit } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, shippingMethod = 'standard', couponCode, orderNumber } = body;
    const rawCart = Array.isArray(cart) ? cart : [];
    const cleanCart = rawCart.filter(item => item && item.id && item.size && Number(item.qty) > 0);

    // 1. Input Validation
    if (cleanCart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid.' }, { status: 400 });
    }

    // 2. Validate Stock Availability against Supabase Inventory
    const stockCheck = await validateStockAvailability(cleanCart, supabaseServer);
    if (!stockCheck.valid) {
      return NextResponse.json(
        { error: 'Some items in your cart exceed available stock.', outOfStockItems: stockCheck.outOfStockItems },
        { status: 400 }
      );
    }

    // 3. Server-side Price & Total Calculation
    // Fetch product details from DB to prevent frontend amount tampering
    const productIds = cart.map((item: any) => item.id);
    const { data: products, error: dbError } = await supabaseServer
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (dbError || !products) {
      logAudit('razorpay_create_order_db_error', 'error', { error: dbError?.message });
      return NextResponse.json({ error: 'Failed to verify product prices.' }, { status: 500 });
    }

    const priceMap = new Map<string, number>();
    products.forEach((p: any) => priceMap.set(p.id, Number(p.price) || 0));

    let subtotal = 0;
    for (const item of cart) {
      const price = priceMap.get(item.id) || 0;
      subtotal += price * (Number(item.qty) || 1);
    }

    // Handle Coupon Discount Verification if provided
    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabaseServer
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
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

    // Calculate shipping based on settings threshold
    const { data: settingsData } = await supabaseServer.from('settings').select('*');
    let freeShippingThreshold = 1999;
    let flatShippingRate = 100;
    if (settingsData) {
      settingsData.forEach((row: any) => {
        if (row.key === 'free_shipping_threshold') freeShippingThreshold = Number(row.value) || 1999;
        if (row.key === 'flat_shipping_rate') flatShippingRate = Number(row.value) || 100;
      });
    }

    const shippingCost = 0;
    const totalAmountINR = discountedSubtotal;
    const totalAmountPaise = Math.round(totalAmountINR * 100);

    if (totalAmountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid order total.' }, { status: 400 });
    }

    // 4. Initialize Razorpay Server SDK & Create Order
    const razorpay = getRazorpayInstance();
    const receipt = `dvero_rcpt_${orderNumber || Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt,
      notes: {
        store: "D'VERO",
        order_number: orderNumber || '',
      },
    });

    logAudit('razorpay_order_created', 'info', {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      receipt,
    });

    // 5. Return safe public details to client
    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || '',
    });
  } catch (error: any) {
    logAudit('razorpay_create_order_error', 'error', { error: error?.message || 'Unknown error' });
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize payment gateway.' },
      { status: 500 }
    );
  }
}
