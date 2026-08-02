import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: "Learn how D'VERO Jaipur collects, protects, and uses client personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="page-fade py-12 md:py-20 min-h-[70vh]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <h1 className="font-oswald text-3xl sm:text-4xl uppercase mb-3">Privacy Policy</h1>
        <p className="font-oswald text-xs uppercase tracking-wider text-mute mb-8 border-b border-line pb-4">
          Effective Date: July 2026 | D'VERO Jaipur Formalwear
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">1. Information We Collect</h2>
            <p>
              When you browse or place an order with D'VERO, we collect personal information required to process your formalwear tailoring and dispatch, including your name, email address, phone number, shipping address, and order payment preferences.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">2. Payment Security</h2>
            <p>
              All online payments (UPI, Credit/Debit Cards, Netbanking) are processed securely through PCI-DSS compliant payment gateways (Razorpay). D'VERO never stores card numbers, CVVs, or bank credentials on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">3. How We Use Your Data</h2>
            <p>
              Your data is strictly utilized for order fulfilment, tracking SMS updates, customer support, and optional newsletter collection drop invitations. We never sell or share your personal data with third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-lg uppercase text-ink mb-2">4. Your Rights</h2>
            <p>
              You may request access to, correction of, or complete deletion of your account profile at any time by contacting support at support@dvero.com or accessing your Account Profile Dashboard.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
