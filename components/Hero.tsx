'use client';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useSettings } from '@/lib/useSettings';
import { DEFAULT_HOMEPAGE_HERO } from '@/lib/homepageDefaults';

const POSITION_MAP: Record<string, string> = {
  top: 'center top',
  center: 'center center',
  bottom: 'center bottom',
  left: 'left center',
  right: 'right center',
};

export function Hero() {
  const { settings } = useSettings();
  const hero = settings.homepage_hero || DEFAULT_HOMEPAGE_HERO;

  if (!hero.enabled) return null;

  const imageStyle: CSSProperties = {
    objectPosition: POSITION_MAP[hero.image_position] || 'center center',
    transform: `scale(${(hero.image_scale || 100) / 100})`,
    borderRadius: `${hero.border_radius || 0}px`,
  };

  const Image = hero.desktop_image ? (
    <picture className="absolute inset-0 w-full h-full block overflow-hidden" style={{ borderRadius: `${hero.border_radius || 0}px` }}>
      {hero.mobile_image && <source media="(max-width: 767px)" srcSet={hero.mobile_image} />}
      <img src={hero.desktop_image} alt={hero.heading} className="w-full h-full object-cover" style={imageStyle} />
      {hero.overlay_opacity > 0 && (
        <div className="absolute inset-0" style={{ backgroundColor: '#000', opacity: (hero.overlay_opacity || 0) / 100 }} />
      )}
    </picture>
  ) : null;

  const content = (
    <>
      <div className="font-inter text-[0.68rem] sm:text-xs tracking-[0.22em] uppercase opacity-70 mb-4">{hero.label}</div>
      <h1 className="font-playfair font-medium uppercase text-[2.6rem] sm:text-[3.4rem] md:text-[4rem] leading-[1.05]">
        {hero.heading}
      </h1>
      <p className="max-w-[30ch] mt-4 sm:mt-5 text-sm opacity-80 leading-relaxed font-inter">{hero.description}</p>
      {hero.button_text && hero.button_link && (
        <Link
          href={hero.button_link}
          className="inline-flex mt-7 sm:mt-9 font-inter text-xs tracking-[0.14em] uppercase px-8 py-4 w-fit transition-opacity hover:opacity-80"
          style={{ backgroundColor: hero.text_color, color: hero.bg_color }}
        >
          {hero.button_text}
        </Link>
      )}
    </>
  );

  if (hero.layout === 'full') {
    return (
      <section className="relative min-h-[62vh] sm:min-h-[70vh] md:min-h-[90vh] flex items-end" style={{ backgroundColor: hero.bg_color, color: hero.text_color }}>
        {Image}
        <div className="relative z-10 px-6 sm:px-10 md:px-16 py-14 md:py-20 max-w-[640px]">{content}</div>
      </section>
    );
  }

  if (hero.layout === 'center') {
    return (
      <section className="relative min-h-[50vh] sm:min-h-[58vh] md:min-h-[70vh] flex items-center justify-center text-center" style={{ backgroundColor: hero.bg_color, color: hero.text_color }}>
        <div className="relative z-10 px-6 flex flex-col items-center max-w-[640px] mx-auto">{content}</div>
      </section>
    );
  }

  return (
    <section className="relative" style={{ backgroundColor: hero.bg_color, color: hero.text_color }}>
      <div className="grid md:grid-cols-[1fr_1.15fr] min-h-[60vh] sm:min-h-[66vh] md:min-h-[86vh]">
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-10 md:px-16 py-14 md:py-0">{content}</div>
        <div className="relative min-h-[280px] md:min-h-0 overflow-hidden">
          {Image || <div className="w-full h-full" style={{ background: `linear-gradient(200deg, ${hero.bg_color} 0%, #000 120%)` }} />}
        </div>
      </div>
    </section>
  );
}
