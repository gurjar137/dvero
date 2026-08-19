'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';

export default function OrderTrackingPage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      // Fetch order via API route first, fallback to client query
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(params.orderNumber)}`);
        if (res.ok) {
          const apiData = await res.json();
          if (apiData.success && apiData.order) {
            setOrder(apiData.order as Order);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', params.orderNumber)
        .maybeSingle();

      if (data) setOrder(data as Order);
      setLoading(false);
    }
    fetchOrder();
  }, [params.orderNumber]);

  async function handleCancelOrder() {
    if (!order) return;
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to cancel Order #${order.order_number}?`)) {
      return;
    }
    setCancelling(true);
    setCancelError('');

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.order_number }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOrder(prev => (prev ? { ...prev, status: 'cancelled' } : null));
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('order_number', order.order_number);

        if (!error) {
          setOrder(prev => (prev ? { ...prev, status: 'cancelled' } : null));
        } else {
          setCancelError(data.error || 'Could not cancel order.');
        }
      }
    } catch (err: any) {
      setCancelError(err?.message || 'Error cancelling order.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh]">
        <p className="font-oswald text-xs uppercase tracking-wider text-mute">Locating Order Details...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh]">
        <h2 className="font-oswald text-2xl uppercase mb-3">Order Not Found</h2>
        <p className="text-mute text-sm mb-6">Could not find an order matching #{params.orderNumber}.</p>
        <Link href="/" className="font-oswald text-xs tracking-wider uppercase border-b border-ink">
          Return To Shop →
        </Link>
      </main>
    );
  }

  const steps = ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const;
  const currentStepIdx = steps.indexOf(order.status as any);

  return (
    <main className="page-fade py-10 md:py-16 min-h-[70vh]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Breadcrumb */}
        <div className="font-oswald text-xs tracking-wider uppercase text-mute mb-6">
          <Link href="/" className="hover:text-ink">Home</Link> / <span className="text-ink">Track Order #{order.order_number}</span>
        </div>

        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-line pb-6 mb-8">
          <div>
            <h1 className="font-oswald text-2xl sm:text-3xl uppercase">Order #{order.order_number}</h1>
            <p className="text-mute text-xs mt-1">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <Link
              href={`/orders/invoice/${order.order_number}`}
              className="border border-line hover:border-ink font-oswald text-xs tracking-wider uppercase px-4 py-2.5 rounded-sm transition-colors flex items-center text-ink min-h-[44px]"
            >
              Download Invoice PDF 📄
            </Link>

            {order.status === 'delivered' ? (
              <Link
                href={`/orders/return/${order.order_number}`}
                className="bg-ink text-bg hover:bg-camelDeep font-oswald text-xs tracking-wider uppercase px-4 py-2.5 rounded-sm transition-colors flex items-center min-h-[44px]"
              >
                Return / Exchange ↩
              </Link>
            ) : order.status === 'cancelled' ? (
              <span className="border border-red-200 bg-red-50 text-red-700 font-oswald text-xs tracking-wider uppercase px-4 py-2.5 rounded-sm flex items-center min-h-[44px]">
                ORDER CANCELLED ✕
              </span>
            ) : (
              <button
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="border border-red-300 text-red-700 hover:bg-red-50 font-oswald text-xs tracking-wider uppercase px-4 py-2.5 rounded-sm transition-colors flex items-center min-h-[44px] cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order ✕'}
              </button>
            )}
          </div>
        </div>

        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-6 font-oswald text-xs uppercase tracking-wider">
            ⚠️ {cancelError}
          </div>
        )}

        {/* Cancelled Banner */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 font-oswald text-xs uppercase tracking-wider flex items-center gap-2">
            <span>⚠️</span> THIS ORDER HAS BEEN CANCELLED
          </div>
        )}

        {/* Visual Progress Bar */}
        <div className="bg-panel border border-line p-6 sm:p-8 rounded-md mb-10 shadow-sm2">
          <h3 className="font-oswald text-xs uppercase tracking-widest text-camelDeep mb-6">Delivery Progress</h3>

          <div className="grid grid-cols-5 gap-2 relative">
            {steps.map((step, idx) => {
              const completed = order.status !== 'cancelled' && idx <= currentStepIdx;
              const isCurrent = order.status !== 'cancelled' && idx === currentStepIdx;
              return (
                <div key={step} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-oswald text-xs transition-all ${
                      order.status === 'cancelled'
                        ? 'bg-line text-mute opacity-50'
                        : isCurrent
                        ? 'bg-camelDeep text-bg ring-4 ring-camel/30 font-bold scale-110'
                        : completed
                        ? 'bg-ink text-bg'
                        : 'bg-line text-mute'
                    }`}
                  >
                    {order.status === 'cancelled' ? '✕' : completed ? '✓' : idx + 1}
                  </div>
                  <span className={`font-oswald text-[0.65rem] sm:text-xs uppercase tracking-wider mt-3 ${completed ? 'text-ink' : 'text-mute'}`}>
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-line flex flex-wrap justify-between items-center text-xs font-oswald uppercase text-mute gap-4">
            <div>
              <span>Estimated Delivery: </span>
              <span className="text-ink font-semibold">
                {order.status === 'cancelled'
                  ? 'N/A (Cancelled)'
                  : order.delivery_date
                  ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '4–7 Business Days'}
              </span>
            </div>
            <div>
              <span>Tracking Ref: </span>
              <span className="text-ink font-mono">{order.tracking_number || 'TRK-' + order.order_number}</span>
            </div>
          </div>
        </div>

        {/* Items & Shipping Summary */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-panel border border-line p-6 rounded-md">
            <h3 className="font-oswald text-sm uppercase mb-4 border-b border-line pb-2">Items Ordered</h3>
            <div className="space-y-3">
              {(order.order_items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <div className="font-oswald uppercase text-ink">{item.product_name}</div>
                    <div className="text-mute">Size: {item.size} × Qty: {item.qty}</div>
                  </div>
                  <div className="font-oswald text-camelDeep">{formatINR(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-panel border border-line p-6 rounded-md">
            <h3 className="font-oswald text-sm uppercase mb-4 border-b border-line pb-2">Shipping Destination</h3>
            <p className="text-xs text-mute leading-relaxed">
              <strong className="text-ink font-oswald uppercase">{order.customer_name}</strong><br />
              {order.address}<br />
              {order.city}, {order.state} – {order.pincode}<br />
              Phone: {order.phone}<br />
              Email: {order.email}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
