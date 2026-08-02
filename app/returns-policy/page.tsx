import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy',
  description: "D'VERO 14-day doorstep return and size exchange policy.",
};

export default function ReturnsPolicyPage() {
  return (
    <main className="page-fade py-12 md:py-20 min-h-[70vh]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <h1 className="font-oswald text-3xl sm:text-4xl uppercase mb-3">Return & Exchange Policy</h1>
        <p className="font-oswald text-xs uppercase tracking-wider text-mute mb-8 border-b border-line pb-4">
          Easy 14-Day Doorstep Returns & Exchanges
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">1. 14-Day Return Guarantee</h2>
            <p>
              If your garment does not fit perfectly, you may request a hassle-free doorstep return or size exchange within 14 days of delivery through your Account Dashboard or Order Tracker.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">2. Eligibility Conditions</h2>
            <p>
              Garments must be unworn, unwashed, unaltered, and submitted with all original D'VERO luxury tags attached in original packaging.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">3. Refund Processing</h2>
            <p>
              Once returned items pass quality inspection at our Jaipur studio, refunds are credited back to your original payment method or UPI bank account within 3–5 business days.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
