'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#111111] text-[#FAF9F6] pt-10 sm:pt-12 md:pt-14 pb-8 border-t border-[#222222]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-14">
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 pb-8 sm:pb-10 border-b border-[#222222]">
          
          {/* 1. D'VERO BRAND STATEMENT */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="font-playfair text-xl tracking-[0.25em] uppercase text-white hover:opacity-80 transition-opacity block mb-3 select-none">
              D'VERO
            </Link>
            <p className="text-xs text-[#999999] leading-relaxed max-w-[260px]">
              Modern retro menswear designed in Jaipur, India.
              <span className="block mt-1 text-[#CCCCCC] uppercase tracking-wider text-[0.65rem]">Tailored by the past. Defined for today.</span>
            </p>
          </div>

          {/* 2. SHOP & EXPLORE */}
          <div>
            <h4 className="font-inter text-[0.7rem] tracking-[0.2em] uppercase text-[#888888] font-medium mb-3">
              Shop
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#CCCCCC] mb-6">
              <li><Link href="/category/shirts" className="hover:text-white transition-colors">Shirts</Link></li>
              <li><Link href="/category/trousers" className="hover:text-white transition-colors">Trousers</Link></li>
            </ul>

            <h4 className="font-inter text-[0.7rem] tracking-[0.2em] uppercase text-[#888888] font-medium mb-3">
              Explore
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#CCCCCC]">
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Studio</Link></li>
            </ul>
          </div>

          {/* 3. POLICIES */}
          <div>
            <h4 className="font-inter text-[0.7rem] tracking-[0.2em] uppercase text-[#888888] font-medium mb-3">
              Policies
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#CCCCCC]">
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns-policy" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* 4. NEWSLETTER & SOCIAL */}
          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="font-inter text-[0.7rem] tracking-[0.2em] uppercase text-[#888888] font-medium mb-1.5">
              Join The List
            </h4>
            <p className="text-xs text-[#999999] mb-3">
              Be first to hear about new drops and studio updates.
            </p>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="flex items-center border-b border-[#444444] pb-1.5 mb-5 focus-within:border-white transition-colors"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="bg-transparent flex-1 text-xs outline-none placeholder:text-[#666666] text-white pr-2 font-inter"
              />
              <button
                type="submit"
                className="font-inter text-[0.7rem] tracking-wider uppercase text-[#CCCCCC] hover:text-white transition-colors shrink-0"
              >
                {subscribed ? 'Joined ✓' : 'Subscribe →'}
              </button>
            </form>

            <div>
              <h4 className="font-inter text-[0.65rem] tracking-[0.2em] uppercase text-[#888888] font-medium mb-2">
                Social
              </h4>
              <div className="flex gap-4 text-xs text-[#CCCCCC]">
                <a
                  href="https://instagram.com/dvero.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Pinterest
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT STRIP */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[0.68rem] tracking-widest text-[#777777] font-inter uppercase">
          <span>© 2026 D'VERO</span>
          <span>JAIPUR, RAJASTHAN, INDIA</span>
        </div>
      </div>
    </footer>
  );
}
