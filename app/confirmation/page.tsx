'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatINR, formatLongDate } from '@/lib/utils';

type LastOrder = {
  orderNumber: string;
  total: number;
  deliveryDate: string;
  customerName?: string;
  email?: string;
  paymentMethod?: string;
  shippingAddress?: string;
};

const TIMELINE_STEPS = [
  { label: 'Order Confirmed', desc: 'Received & Verified', status: 'completed' },
  { label: 'Preparing Your Order', desc: 'Jaipur Atelier Selection', status: 'current' },
  { label: 'Quality Inspection', desc: 'Hand Cut & Checked', status: 'upcoming' },
  { label: 'Packed Carefully', desc: 'Eco Garment Sleeve', status: 'upcoming' },
  { label: 'Shipped', desc: 'Courier In Transit', status: 'upcoming' },
  { label: 'Out For Delivery', desc: 'Doorstep Delivery', status: 'upcoming' },
  { label: 'Delivered', desc: 'Completed', status: 'upcoming' },
];

export default function ConfirmationPage() {
  const router = useRouter();
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('dvero_last_order');
    if (!raw) {
      router.replace('/');
      return;
    }
    const parsed = JSON.parse(raw);
    setOrder(parsed);

    // Show full details after 3 seconds of luxury intro animation
    const timer = setTimeout(() => {
      setShowFullContent(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!order) return null;

  return (
    <main className="page-fade min-h-[85vh] py-10 md:py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Subtle Luxury Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-camel/20 blur-3xl pointer-events-none animate-pulse" />

      {/* FULL SCREEN / HIGH IMPACT INTRO ANIMATION (First 3 Seconds) */}
      {!showFullContent ? (
        <div className="max-w-xl mx-auto text-center py-16 sm:py-24 space-y-6 animate-fadeIn">
          {/* Animated 60fps Luxury Checkmark */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-camelDeep/30 animate-ping opacity-25" />
            <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#1D1A15"
                strokeWidth="3.5"
                strokeDasharray="345"
                strokeDashoffset="345"
                style={{ animation: 'drawCircle 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
              />
              <path
                d="M28 52 L44 68 L74 34"
                fill="none"
                stroke="#B78F5E"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="70"
                strokeDashoffset="70"
                style={{ animation: 'drawCheck 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.75s' }}
              />
            </svg>
          </div>

          <div className="space-y-2 animate-slideUp">
            <div className="font-oswald text-xs uppercase tracking-[0.25em] text-camelDeep">✓ Order Confirmed</div>
            <h1 className="font-cinzel text-2xl sm:text-4xl uppercase tracking-[0.14em] text-ink">
              Thank You, {order.customerName || 'Valued Client'}
            </h1>
            <p className="text-mute text-xs sm:text-sm max-w-md mx-auto leading-relaxed pt-1 font-inter">
              Your order has been placed successfully. Your garments will now move through our premium quality inspection process before being shipped.
            </p>
          </div>

          <button
            onClick={() => setShowFullContent(true)}
            className="font-oswald text-[0.68rem] uppercase tracking-widest text-mute hover:text-ink underline pt-4 cursor-pointer"
          >
            View Order Receipt & Details →
          </button>
        </div>
      ) : (
        /* FULL ORDER SUCCESS SUMMARY & PROGRESS TIMELINE */
        <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10 animate-fadeIn">
          {/* Main Success Card */}
          <div className="bg-panel border border-line rounded-xl shadow-2xl p-6 sm:p-10 md:p-12 text-center relative overflow-hidden space-y-6">
            <div className="w-16 h-16 bg-bg border border-line rounded-full flex items-center justify-center mx-auto text-camelDeep font-bold text-2xl shadow-sm2">
              ✓
            </div>

            <div className="space-y-2">
              <div className="font-oswald text-xs uppercase tracking-[0.2em] text-camelDeep">Order #{order.orderNumber}</div>
              <h2 className="font-cinzel text-2xl sm:text-3xl uppercase tracking-widest text-ink">Order Confirmed</h2>
              <p className="text-mute text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Thank you, <strong className="text-ink font-medium">{order.customerName || 'Valued Client'}</strong>! We appreciate your trust in D'VERO.
              </p>
            </div>

            {/* Structured Order Information Grid */}
            <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 text-left space-y-3 text-xs sm:text-sm font-oswald uppercase tracking-wider">
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-mute">Order Reference</span>
                <span className="font-mono text-ink font-bold">#{order.orderNumber}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-mute">Est. Delivery Date</span>
                <span className="text-ink">{formatLongDate(new Date(order.deliveryDate))}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-mute">Payment Method</span>
                <span className="text-ink">{order.paymentMethod || 'Prepaid / COD'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-mute">Total Amount Paid</span>
                <span className="text-camelDeep font-bold text-base">{formatINR(order.total)}</span>
              </div>

              {order.shippingAddress && (
                <div className="py-2 pt-3">
                  <div className="text-mute text-[0.65rem] mb-1">Shipping Address</div>
                  <div className="font-inter text-xs text-ink normal-case leading-relaxed font-normal">
                    {order.shippingAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Email Confirmation Dispatch Notice */}
            <div className="bg-panel border border-line rounded-md p-3.5 text-xs text-mute flex items-center justify-center gap-2">
              <span>📧</span>
              <span>A confirmation email has been sent to <strong className="text-ink font-mono">{order.email}</strong></span>
            </div>
          </div>

          {/* Animated Order Progress Timeline */}
          <div className="bg-panel border border-line rounded-xl shadow-sm2 p-6 sm:p-8 space-y-6">
            <h3 className="font-oswald text-base uppercase tracking-wider text-ink border-b border-line pb-3">
              Garment Preparation Timeline
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l border-line space-y-6 sm:space-y-8">
              {TIMELINE_STEPS.map((step, idx) => (
                <div key={idx} className="relative flex items-start justify-between group">
                  {/* Circle Marker */}
                  <span
                    className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-4 h-4 rounded-full border-2 transition-all ${
                      step.status === 'completed'
                        ? 'bg-camelDeep border-camelDeep text-white ring-4 ring-camel/20'
                        : step.status === 'current'
                        ? 'bg-ink border-ink animate-pulse ring-4 ring-ink/10'
                        : 'bg-bg border-line'
                    }`}
                  />

                  <div>
                    <div
                      className={`font-oswald text-xs sm:text-sm uppercase tracking-wider ${
                        step.status === 'completed' || step.status === 'current'
                          ? 'text-ink font-semibold'
                          : 'text-mute'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-[0.7rem] text-mute font-inter mt-0.5">{step.desc}</div>
                  </div>

                  {step.status === 'completed' && (
                    <span className="font-oswald text-[0.62rem] uppercase tracking-widest text-camelDeep bg-bg border border-line px-2 py-0.5 rounded">
                      Completed ✓
                    </span>
                  )}
                  {step.status === 'current' && (
                    <span className="font-oswald text-[0.62rem] uppercase tracking-widest text-ink bg-bg border border-line px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Elegant Appreciation Statement */}
          <div className="bg-panel border border-line rounded-xl p-6 sm:p-8 text-center space-y-3">
            <p className="font-cinzel text-sm sm:text-base text-ink tracking-wider leading-relaxed">
              &ldquo;Every D'VERO garment is crafted with meticulous attention to detail and designed to elevate everyday formalwear.&rdquo;
            </p>
            <p className="text-xs text-mute font-inter">
              Thank you for choosing us. We look forward to serving your sartorial wardrobe.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-panel border border-line rounded p-3 text-xs font-oswald uppercase tracking-wider text-ink/90">
              ✓ Secure Payment
            </div>
            <div className="bg-panel border border-line rounded p-3 text-xs font-oswald uppercase tracking-wider text-ink/90">
              ✓ 14-Day Returns
            </div>
            <div className="bg-panel border border-line rounded p-3 text-xs font-oswald uppercase tracking-wider text-ink/90">
              ✓ Jaipur Atelier
            </div>
            <div className="bg-panel border border-line rounded p-3 text-xs font-oswald uppercase tracking-wider text-ink/90">
              ✓ Concierge Support
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Link
              href={`/orders/track/${order.orderNumber}`}
              className="block w-full bg-ink text-bg text-center py-4 rounded-sm font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-all min-h-[44px] flex items-center justify-center shadow-sm2"
            >
              Track Live Order Status →
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/orders/invoice/${order.orderNumber}`}
                className="block text-center border border-line bg-panel py-3 rounded-sm font-oswald text-xs tracking-wider uppercase hover:border-ink min-h-[44px] flex items-center justify-center"
              >
                Download Invoice 📄
              </Link>
              <Link
                href="/profile"
                className="block text-center border border-line bg-panel py-3 rounded-sm font-oswald text-xs tracking-wider uppercase hover:border-ink min-h-[44px] flex items-center justify-center"
              >
                View Order History
              </Link>
              <Link
                href="/"
                className="block text-center border border-line bg-panel py-3 rounded-sm font-oswald text-xs tracking-wider uppercase hover:border-ink min-h-[44px] flex items-center justify-center"
              >
                Continue Shopping →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
