import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Cancellation Policy',
  description: "D'VERO shipping timelines, express courier options, and cancellation rules.",
};

export default function ShippingPolicyPage() {
  return (
    <main className="page-fade py-12 md:py-20 min-h-[70vh]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <h1 className="font-oswald text-3xl sm:text-4xl uppercase mb-3">Shipping & Cancellation Policy</h1>
        <p className="font-oswald text-xs uppercase tracking-wider text-mute mb-8 border-b border-line pb-4">
          Pan-India Express Delivery & Orders
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">1. Shipping Options & Costs</h2>
            <p>
              We offer Standard Delivery (4–6 business days, FREE on all orders) and Express Air Courier (2–3 business days, FREE on all orders).
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">2. Order Cancellation</h2>
            <p>
              Orders can be cancelled free of charge at any point before courier dispatch directly from your Profile Orders Dashboard. Once dispatched, standard return procedures apply.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
