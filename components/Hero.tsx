'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/lib/useSettings';
import { DEFAULT_HOMEPAGE_HERO } from '@/lib/homepageDefaults';

export function Hero() {
  const { settings } = useSettings();
  const hero = settings.homepage_hero || DEFAULT_HOMEPAGE_HERO;

  const defaultHeroImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=85';
  const heroImageSrc = hero.desktop_image || defaultHeroImage;

  return (
    <section className="relative w-full h-[100vh] h-[100dvh] sm:h-[80vh] lg:h-screen min-h-[500px] overflow-hidden bg-[#111111]">
      {/* Background Photography with Cinematic Scale Zoom */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Image
          src={heroImageSrc}
          alt="D'VERO Luxury Formalwear"
          fill
          priority
          unoptimized={heroImageSrc.startsWith('data:') || heroImageSrc.startsWith('blob:')}
          className="object-cover object-center transition-transform duration-10000 ease-out scale-105 group-hover:scale-110"
        />
        {/* Soft 15% Editorial Dark Overlay for optimal text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Left-Aligned Editorial Text Content (Lower-left on mobile) */}
      <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 sm:px-10 md:px-16 flex flex-col justify-end pb-16 sm:pb-20 md:justify-center items-start text-white">
        <span className="font-inter text-xs sm:text-sm tracking-[0.3em] uppercase text-white/80 font-medium mb-3 sm:mb-4 animate-fadeIn">
          D'VERO
        </span>
        <h1 className="font-playfair text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal uppercase tracking-[0.1em] leading-[1.1] mb-3 sm:mb-4 drop-shadow-md animate-fadeIn">
          Modern Formal Wear
        </h1>
        <p className="font-inter text-sm sm:text-base md:text-lg text-white/90 font-light tracking-wide mb-8 sm:mb-10 max-w-[32ch] animate-fadeIn">
          Crafted for Men Who Lead.
        </p>
        <Link
          href="#featured-collection"
          className="inline-flex font-inter text-xs sm:text-sm tracking-[0.2em] uppercase bg-white text-[#111111] px-8 sm:px-10 py-4 font-medium hover:bg-[#111111] hover:text-white border border-white transition-all duration-300 shadow-xl"
        >
          SHOP COLLECTION
        </Link>
      </div>
    </section>
  );
}
