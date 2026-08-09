import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: "Terms and Conditions for purchasing formalwear garments from D'VERO.",
};

export default function TermsPage() {
  return (
    <main className="page-fade py-12 md:py-20 min-h-[70vh]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <h1 className="font-oswald text-3xl sm:text-4xl uppercase mb-3">Terms & Conditions</h1>
        <p className="font-oswald text-xs uppercase tracking-wider text-mute mb-8 border-b border-line pb-4">
          Effective Date: July 2026 | D'VERO Formalwear
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing dvero.com or purchasing our formalwear pieces, you agree to be bound by these Terms & Conditions. All garments are crafted according to published size measurements and fabric specifications.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">2. Pricing & Currency</h2>
            <p>
              All prices listed on D'VERO are in Indian Rupees (INR) and include applicable GST taxes. We reserve the right to modify prices or correct errors prior to order confirmation.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">3. Intellectual Property</h2>
            <p>
              All designs, garment photography, branding, and imagery are the exclusive intellectual property of D'VERO. Unauthorized reproduction or resale is prohibited.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
