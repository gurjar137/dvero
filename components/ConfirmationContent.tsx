'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatINR, formatLongDate } from '@/lib/utils';
import { Order, OrderItem } from '@/lib/types';

export function ConfirmationContent({ orderNumberProp }: { orderNumberProp?: string }) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [sessionOrder, setSessionOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryOrderNum = searchParams.get('order') || searchParams.get('order_number');
    let cachedOrder: any = null;

    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem('dvero_last_order');
      if (raw) {
        try {
          cachedOrder = JSON.parse(raw);
          setSessionOrder(cachedOrder);
        } catch (e) {}
      }
    }

    const orderNum = orderNumberProp || queryOrderNum || cachedOrder?.orderNumber;

    if (!orderNum) {
      setLoading(false);
      return;
    }

    // Fetch order record from Supabase database via API route first, fallback to client query
    async function loadOrderFromDB() {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNum)}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData.success && apiData.order) {
            setOrder(apiData.order as Order);
            setLoading(false);
            return;
          }
        }

        // Fallback: direct client query
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_number', orderNum)
          .maybeSingle();

        if (data && !error) {
          setOrder(data as Order);
        }
      } catch (e) {
        console.error('Error fetching order:', e);
      } finally {
        setLoading(false);
      }
    }

    loadOrderFromDB();
  }, [searchParams, orderNumberProp]);

  const displayOrderNumber =
    orderNumberProp || order?.order_number || sessionOrder?.orderNumber || searchParams.get('order') || '';
  const displayCustomerName = order?.customer_name || sessionOrder?.customerName || 'Valued Client';
  const displayEmail = order?.email || sessionOrder?.email || '';
  const displayPhone = order?.phone || '';
  const rawPaymentMethod = order?.payment_method || sessionOrder?.paymentMethod || 'razorpay';
  const displayPaymentMethod =
    rawPaymentMethod.toLowerCase() === 'cod'
      ? 'Cash on Delivery (COD)'
      : rawPaymentMethod.toLowerCase() === 'razorpay'
      ? 'Prepaid (UPI / Card / Razorpay)'
      : rawPaymentMethod;
  const displayPaymentStatus =
    order?.payment_status ||
    sessionOrder?.paymentStatus ||
    (displayPaymentMethod.toLowerCase().includes('cod') ? 'Cash on Delivery' : 'Paid');

  const displaySubtotal =
    order?.subtotal ??
    (order?.order_items && order.order_items.length > 0
      ? order.order_items.reduce((acc, item) => acc + (Number(item.price) || 0) * item.qty, 0)
      : sessionOrder?.total ?? 0);

  const displayTotal = order?.total ?? sessionOrder?.total ?? displaySubtotal;

  const displayCreatedDate = order?.created_at ? new Date(order.created_at) : new Date();

  const displayDeliveryDate = order?.delivery_date
    ? new Date(order.delivery_date)
    : sessionOrder?.deliveryDate
    ? new Date(sessionOrder.deliveryDate)
    : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const displayAddress = order
    ? `${order.address}, ${order.city}, ${order.state} - ${order.pincode}`
    : sessionOrder?.shippingAddress || '';

  if (loading) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 space-y-4">
        <div className="w-12 h-12 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-oswald text-xs uppercase tracking-widest text-mute">Loading Order Confirmation...</p>
      </div>
    );
  }

  if (!displayOrderNumber && !order && !sessionOrder) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-6">
        <h1 className="font-cinzel text-2xl uppercase tracking-widest text-ink">No Recent Order Found</h1>
        <p className="text-xs text-mute font-inter max-w-sm mx-auto leading-relaxed">
          If you recently placed an order, you can check its status from your profile order history.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/profile"
            className="bg-ink text-bg font-oswald text-xs uppercase px-6 py-3 rounded-sm hover:bg-camelDeep transition-all min-h-[44px] flex items-center"
          >
            View My Orders
          </Link>
          <Link
            href="/"
            className="border border-line bg-panel font-oswald text-xs uppercase px-6 py-3 rounded-sm hover:border-ink transition-all min-h-[44px] flex items-center text-ink"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
      {/* Editorial Luxury Header & Success Badge */}
      <div className="text-center space-y-4 pt-2 sm:pt-6 animate-fadeIn">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-camelDeep/30 animate-ping opacity-20" />
          <div className="w-full h-full rounded-full bg-panel border border-line flex items-center justify-center shadow-md">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-camelDeep">
              <path
                d="M28 52 L44 68 L74 34"
                fill="none"
                stroke="#B78F5E"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-oswald text-xs sm:text-sm uppercase tracking-[0.3em] text-camelDeep font-medium">
            ✓ ORDER PLACED SUCCESSFULLY
          </div>
          <h1 className="font-cinzel text-2xl sm:text-4xl uppercase tracking-[0.14em] text-ink font-normal">
            Thank You For Choosing D&apos;VERO.
          </h1>
          <p className="text-mute text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-inter">
            Your order has been confirmed. We are preparing your bespoke garments with precision.
          </p>
        </div>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-panel border border-line rounded-xl shadow-md p-6 sm:p-10 text-left space-y-6">
        <div className="flex flex-wrap justify-between items-center border-b border-line pb-4 gap-2">
          <div>
            <div className="text-[0.65rem] font-oswald uppercase tracking-widest text-mute">Order Number</div>
            <div className="font-mono text-base sm:text-lg text-ink font-bold tracking-wider">{displayOrderNumber}</div>
          </div>
          <span className="font-oswald text-xs uppercase tracking-wider bg-bg border border-line px-3 py-1 rounded text-camelDeep font-semibold">
            {displayPaymentStatus}
          </span>
        </div>

        {/* Key Info Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-oswald uppercase tracking-wider">
          <div className="bg-bg border border-line rounded-md p-4 space-y-1">
            <span className="text-mute text-[0.65rem] block">Order Date</span>
            <span className="text-ink font-semibold">{formatLongDate(displayCreatedDate)}</span>
          </div>

          <div className="bg-bg border border-line rounded-md p-4 space-y-1">
            <span className="text-mute text-[0.65rem] block">Payment Method</span>
            <span className="text-ink font-semibold">{displayPaymentMethod}</span>
          </div>

          <div className="bg-bg border border-line rounded-md p-4 space-y-1">
            <span className="text-mute text-[0.65rem] block">Expected Delivery Date</span>
            <span className="text-camelDeep font-semibold">{formatLongDate(displayDeliveryDate)}</span>
          </div>

          <div className="bg-bg border border-line rounded-md p-4 space-y-1">
            <span className="text-mute text-[0.65rem] block">Total Paid</span>
            <span className="text-camelDeep font-bold text-base">{formatINR(displayTotal)}</span>
          </div>
        </div>

        {/* Delivering To Recipient Address */}
        {displayAddress && (
          <div className="bg-bg border border-line rounded-md p-4 space-y-1">
            <span className="text-[0.65rem] font-oswald uppercase tracking-widest text-mute block">Delivering To</span>
            <div className="font-oswald text-xs text-ink font-semibold uppercase">{displayCustomerName}</div>
            <div className="font-inter text-xs text-mute normal-case leading-relaxed">{displayAddress}</div>
            {displayPhone && <div className="font-mono text-[0.7rem] text-mute pt-1">Phone: {displayPhone}</div>}
          </div>
        )}

        {/* Purchased Order Items Breakdown Table */}
        {order?.order_items && order.order_items.length > 0 && (
          <div className="space-y-4 border-t border-line pt-5">
            <div className="text-xs font-oswald uppercase tracking-wider text-ink font-semibold">Ordered Items</div>
            <div className="divide-y divide-line border border-line bg-bg rounded-md p-3 sm:p-4">
              {order.order_items.map((item: OrderItem, idx: number) => (
                <div key={idx} className="py-3 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-oswald uppercase text-ink font-medium truncate text-sm">{item.product_name}</div>
                    <div className="text-[0.75rem] text-mute mt-0.5 font-inter">
                      Size: <strong className="text-ink font-oswald">{item.size}</strong> &nbsp;|&nbsp; Quantity: <strong className="text-ink font-oswald">{item.qty}</strong> &nbsp;|&nbsp; Price: {formatINR(item.price)}
                    </div>
                  </div>
                  <div className="font-oswald text-sm text-camelDeep font-semibold text-right">
                    {formatINR((item.price || 0) * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="bg-bg border border-line rounded-md p-4 space-y-2 text-xs font-oswald uppercase">
              <div className="flex justify-between text-mute">
                <span>Subtotal</span>
                <span>{formatINR(displaySubtotal)}</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Shipping</span>
                <span className="text-camelDeep font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-ink font-semibold text-sm pt-2 border-t border-line">
                <span>Total Paid</span>
                <span className="text-camelDeep font-bold">{formatINR(displayTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Email Dispatch Note */}
        {displayEmail && (
          <div className="bg-bg border border-line rounded-md p-3 text-xs text-mute flex items-center justify-center gap-2 text-center">
            <span>✉️</span>
            <span>A confirmation receipt has been sent to <strong className="text-ink font-mono">{displayEmail}</strong></span>
          </div>
        )}
      </div>

      {/* Prominent Luxury Action Buttons */}
      <div className="space-y-3 pt-2">
        <Link
          href={`/orders/track/${displayOrderNumber}`}
          className="block w-full bg-ink text-bg text-center py-4 rounded-sm font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-all min-h-[44px] flex items-center justify-center shadow-sm cursor-pointer"
        >
          TRACK ORDER →
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/profile?tab=orders"
            className="block text-center border border-line bg-panel py-3.5 rounded-sm font-oswald text-xs tracking-wider uppercase text-ink hover:border-ink transition-all min-h-[44px] flex items-center justify-center"
          >
            VIEW ORDER DETAILS
          </Link>
          <Link
            href="/"
            className="block text-center border border-line bg-panel py-3.5 rounded-sm font-oswald text-xs tracking-wider uppercase text-ink hover:border-ink transition-all min-h-[44px] flex items-center justify-center"
          >
            CONTINUE SHOPPING →
          </Link>
        </div>
      </div>

      {/* Need Help? Contact Support Section */}
      <div className="bg-panel border border-line rounded-xl p-5 flex flex-wrap justify-between items-center gap-3 text-xs">
        <div>
          <h4 className="font-oswald uppercase text-ink font-semibold">Need help?</h4>
          <p className="text-mute font-inter text-[0.75rem]">Our client Concierge team is available to assist with sizing or delivery updates.</p>
        </div>
        <Link
          href="/contact"
          className="border border-line bg-bg hover:border-ink px-4 py-2.5 rounded-sm font-oswald text-xs uppercase text-ink transition-colors min-h-[38px] flex items-center"
        >
          Contact Support →
        </Link>
      </div>
    </div>
  );
}
