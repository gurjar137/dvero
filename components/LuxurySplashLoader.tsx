'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export function LuxurySplashLoader() {
  const [stage, setStage] = useState<'entering' | 'holding' | 'exiting' | 'done'>('entering');

  useEffect(() => {
    const holdTimer = setTimeout(() => {
      setStage('holding');
    }, 1200);

    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 2200);

    const doneTimer = setTimeout(() => {
      setStage('done');
    }, 2800);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (stage === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#F8F5EF] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-600 ${
        stage === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transition: stage === 'exiting' ? 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
    >
      <div
        className={`flex flex-col items-center text-center space-y-6 ${
          stage === 'entering' ? 'animate-luxury-appear' : ''
        }`}
      >
        {/* Pure Floating Transparent PNG Logo (Zero square background, boxes, or containers) */}
        <div className="relative w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] md:w-[170px] md:h-[170px]">
          <Image
            src="/images/logo.png"
            alt="D'VERO Logo"
            fill
            className="object-contain bg-transparent"
            priority
          />
        </div>

        {/* Brand Name & Tagline Below */}
        <div className="space-y-1.5">
          <h1 className="font-cormorant font-semibold text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.22em] text-[#141210]">
            D'VERO
          </h1>
          <p className="font-manrope font-medium uppercase text-[10px] tracking-[0.25em] text-[#141210]/40">
            CRAFTED FOR THE MODERN GENTLEMAN
          </p>
        </div>
      </div>
    </div>
  );
}
