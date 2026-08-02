'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { ProductVisual } from './GarmentIcon';

export function FitSlider({ trousers }: { trousers: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  function scroll(dir: number) {
    trackRef.current?.scrollBy({ left: dir * 270, behavior: 'smooth' });
  }
  return (
    <section className="py-4 pb-12 md:pb-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14 flex justify-between items-end gap-8 mb-6 flex-wrap">
        <div>
          <h2 className="font-oswald text-2xl sm:text-3xl md:text-4xl uppercase">Find Your Fit</h2>
          <p className="text-mute text-sm mt-2 max-w-[34ch]">Same trouser, four different drapes. Swipe through and pick how you move.</p>
        </div>
      </div>
      <div ref={trackRef} className="flex gap-5 overflow-x-auto px-4 sm:px-5 md:px-14 pb-4 snap-x snap-mandatory scrollbar-hide">
        {trousers.map(p => (
          <Link key={p.id} href={`/product/${p.id}`}
            className="snap-start flex-none w-[240px] bg-panel px-6 pt-10 pb-6 text-center rounded-md border border-line shadow-sm2 hover:-translate-y-2 hover:shadow-lg2 transition-all duration-300">
            <div className="w-1/2 h-auto mx-auto mb-5 text-camelDeep"><ProductVisual type={p.type} /></div>
            <div className="font-oswald text-sm uppercase mb-1">{p.fit_type}</div>
            <div className="font-oswald text-xs text-mute">{formatINR(p.price)}</div>
          </Link>
        ))}
      </div>
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14 flex justify-end gap-3 mt-2">
        <button onClick={() => scroll(-1)} className="bg-bg border border-line w-9 h-9 rounded-full shadow-sm2 hover:border-ink transition-all">‹</button>
        <button onClick={() => scroll(1)} className="bg-bg border border-line w-9 h-9 rounded-full shadow-sm2 hover:border-ink transition-all">›</button>
      </div>
    </section>
  );
}
