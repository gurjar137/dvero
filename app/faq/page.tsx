import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: "Answers to common questions about D'VERO formalwear sizing, fabrics, shipping, and returns.",
};

const FAQS = [
  { q: 'How do I know my correct fit?', a: 'All D\'VERO garments are cut true to standard Indian formalwear sizing. Refer to our Size Guide on product pages or contact our Jaipur studio for tailoring advice.' },
  { q: 'What is the delivery timeline?', a: 'Standard orders arrive within 4–6 business days. Express Air delivery delivers within 2–3 business days across India.' },
  { q: 'Can I request a size exchange?', a: 'Yes! Exchanges are 100% free within 14 days of delivery. Doorstep pickup is scheduled automatically.' },
  { q: 'What payment options do you accept?', a: 'We accept Razorpay UPI, GPay, PhonePe, Credit/Debit Cards, Netbanking, and Cash on Delivery (COD).' },
];

export default function FAQPage() {
  return (
    <main className="page-fade py-12 md:py-20 min-h-[70vh]">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <h1 className="font-oswald text-3xl sm:text-4xl uppercase mb-3">Frequently Asked Questions</h1>
        <p className="font-oswald text-xs uppercase tracking-wider text-mute mb-8 border-b border-line pb-4">
          Everything You Need to Know About D'VERO
        </p>

        <div className="space-y-6">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-panel border border-line p-6 rounded-md shadow-sm2">
              <h3 className="font-oswald text-base uppercase text-ink mb-2">{faq.q}</h3>
              <p className="text-sm text-mute leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
