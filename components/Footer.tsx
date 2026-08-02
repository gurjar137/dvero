'use client';
import Link from 'next/link';
import { useState } from 'react';

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="bg-ink text-bg pt-14 md:pt-20 pb-8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 pb-8 md:pb-14 border-b border-bg/15 mb-8">
          <div>
            <h4 className="font-inter text-xs tracking-widest uppercase text-bg/50 mb-5">Join The List</h4>
            <p className="text-sm text-bg/70 mb-3">Be first to shop Drop 01.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex border-b border-bg/40">
              <input type="email" required placeholder="Email address" className="bg-transparent flex-1 py-2 text-sm outline-none placeholder:text-bg/40 text-bg" />
              <button type="submit" className="font-inter text-xs tracking-wider uppercase text-camel">{subscribed ? 'Joined ✓' : 'Join →'}</button>
            </form>
          </div>
          <div>
            <h4 className="font-inter text-xs tracking-widest uppercase text-bg/50 mb-5">Shop Collection</h4>
            <ul className="flex flex-col gap-3 text-sm text-bg/80">
              <li><Link href="/category/shirts" className="hover:text-camel">Shirts</Link></li>
              <li><Link href="/category/trousers" className="hover:text-camel">Trousers</Link></li>
              <li><Link href="/about" className="hover:text-camel">Our Story</Link></li>
              <li><Link href="/faq" className="hover:text-camel">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-inter text-xs tracking-widest uppercase text-bg/50 mb-5">Legal & Policies</h4>
            <ul className="flex flex-col gap-3 text-sm text-bg/80">
              <li><Link href="/shipping-policy" className="hover:text-camel">Shipping & Delivery</Link></li>
              <li><Link href="/returns-policy" className="hover:text-camel">Returns & Refunds</Link></li>
              <li><Link href="/privacy" className="hover:text-camel">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-camel">Terms & Conditions</Link></li>
              <li><Link href="/contact" className="hover:text-camel">Contact Studio</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-playfair text-lg tracking-[0.2em] mb-3">D'VERO</div>
            <p className="text-sm text-bg/70 leading-relaxed">Premium formalwear designed in Jaipur, India. Cut true, built to move.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 font-inter text-[0.68rem] tracking-wider text-bg/50 uppercase">
          <span>© 2026 D&rsquo;Vero Jaipur</span>
          <span>Jaipur, Rajasthan, India</span>
          <span>Instagram · Pinterest</span>
        </div>
      </div>
    </footer>
  );
}
