'use client';
import { useState } from 'react';

const FAQS = [
  { q: 'How do I find my size?', a: 'Each product page lists true-to-size fit notes under Details. If you are between sizes, we recommend sizing up for our boxier, relaxed pieces and sizing true for our Office Fit and Straight Fit trousers.' },
  { q: 'What are your shipping times?', a: 'Orders ship within 2 business days. Shipping is free on all orders across India. Standard delivery takes 4 to 6 business days, and Express takes 2 to 3 business days.' },
  { q: 'What is your returns policy?', a: 'Unworn items with tags attached can be returned within 14 days of delivery for a full refund. Simply reach out through the contact form to start a return.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, all major credit and debit cards, and cash on delivery on eligible orders.' },
  { q: 'How should I care for my D Vero pieces?', a: 'Care instructions are listed on each product page under Fabric & Care. Wool-blend and formal trousers are best dry cleaned; cotton shirts can typically be hand washed cold.' }
];

export default function ContactPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <main className="page-fade py-10 md:py-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        <div className="mb-10">
          <h1 className="font-oswald text-2xl sm:text-3xl md:text-4xl uppercase">Get In Touch</h1>
          <p className="text-mute text-sm mt-2">Questions about sizing, an order, or just want to say hello — we read everything.</p>
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr] gap-8 md:gap-14">
          <div className="border-t border-line">
            {FAQS.map((f, i) => (
              <div key={i} className="border-b border-line">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center py-4 font-oswald text-sm tracking-wider uppercase hover:text-camelDeep text-left">
                  {f.q}<span className="text-camelDeep">{open === i ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all ${open === i ? 'max-h-80 pb-5' : 'max-h-0'}`}>
                  <p className="text-sm text-mute leading-relaxed">{f.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-panel rounded-md border border-line shadow-md2 p-8">
              <h3 className="font-oswald text-lg uppercase mb-4">Send A Message</h3>
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="flex flex-col gap-4">
                <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Name</label><input required type="text" className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
                <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Email</label><input required type="email" className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
                <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Message</label><textarea required rows={4} className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
                <button type="submit" className="w-full bg-ink text-bg py-3.5 rounded-sm font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors">Send Message</button>
              </form>
              {sent && <p className="font-oswald text-xs tracking-wider uppercase text-success mt-4">Thanks — we will get back to you within 24 hours.</p>}
            </div>
            <div className="bg-panel rounded-md border border-line shadow-md2 p-8 flex flex-col gap-4">
              {[['Email', 'hello@dvero.in'], ['Phone', '+91 98765 43210'], ['Studio', 'Jaipur, Rajasthan, India'], ['Social', 'Instagram · Pinterest']].map(([l, v]) => (
                <div key={l}><div className="font-oswald text-[0.66rem] tracking-wider uppercase text-mute mb-1">{l}</div><div className="text-sm">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
