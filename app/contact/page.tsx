'use client';

import { useState } from 'react';
import { ContactUsContent } from '@/components/ContactUsContent';

const FAQS = [
  {
    q: 'How do I find my size?',
    a: 'Each product page lists true-to-size fit notes under Details. If you are between sizes, we recommend sizing up for our boxier, relaxed pieces and sizing true for our Office Fit and Straight Fit trousers.',
  },
  {
    q: 'What are your shipping times?',
    a: 'Orders ship within 2 business days. Shipping is free on all orders across India. Standard delivery takes 4 to 6 business days, and Express takes 2 to 3 business days.',
  },
  {
    q: 'What is your returns policy?',
    a: 'Unworn items with tags attached can be returned within 14 days of delivery for a full refund. Simply reach out through the contact form above to start a return.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, Razorpay, all major credit and debit cards, and cash on delivery on eligible orders.',
  },
  {
    q: 'How should I care for my D’VERO pieces?',
    a: 'Care instructions are listed on each product page under Fabric & Care. Wool-blend and formal trousers are best dry cleaned; cotton shirts can typically be hand washed cold.',
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="page-fade py-10 md:py-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14 space-y-16">
        {/* Dynamic Contact Us Main Section */}
        <ContactUsContent showHeader={true} />

        {/* Studio FAQ Section */}
        <div className="pt-10 border-t border-line space-y-8">
          <div className="max-w-xl">
            <h3 className="font-oswald text-xl uppercase tracking-wider text-ink">
              Frequently Asked Questions
            </h3>
            <p className="text-mute text-xs sm:text-sm mt-1 font-inter">
              Quick answers to common questions about orders, sizing, shipping, and returns.
            </p>
          </div>

          <div className="border-t border-line max-w-4xl">
            {FAQS.map((f, i) => (
              <div key={i} className="border-b border-line">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center py-4 font-oswald text-sm tracking-wider uppercase text-ink hover:text-camelDeep text-left transition-colors cursor-pointer"
                >
                  <span>{f.q}</span>
                  <span className="text-camelDeep text-base font-semibold">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-80 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="text-xs sm:text-sm text-mute leading-relaxed font-inter">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
