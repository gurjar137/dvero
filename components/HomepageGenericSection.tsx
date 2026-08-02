'use client';
import Link from 'next/link';
import { useState } from 'react';
import { HomepageSection, HomepageTheme } from '@/lib/types';

function buttonRadius(theme: HomepageTheme) {
  if (theme.button_style === 'pill') return '999px';
  if (theme.button_style === 'rounded') return `${Math.max(theme.border_radius, 8)}px`;
  return `${theme.border_radius}px`;
}

function shadowClass(theme: HomepageTheme) {
  if (theme.shadow === 'strong') return 'shadow-lg';
  if (theme.shadow === 'soft') return 'shadow-sm2';
  return '';
}

export function HomepageGenericSection({ section, theme }: { section: HomepageSection; theme: HomepageTheme }) {
  const [subscribed, setSubscribed] = useState(false);
  const btnStyle = { borderRadius: buttonRadius(theme), backgroundColor: theme.primary_color, color: section.bg_color };

  if (section.id === 'newsletter') {
    return (
      <section style={{ backgroundColor: section.bg_color, color: section.text_color }} className="py-14 md:py-20 text-center">
        <div className="max-w-[560px] mx-auto px-4 sm:px-5">
          <div className="font-inter text-xs tracking-[0.2em] uppercase opacity-70 mb-3">{section.subtitle}</div>
          <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl mb-3">{section.title}</h2>
          <p className="text-sm opacity-80 mb-7">{section.description}</p>
          <form
            onSubmit={e => { e.preventDefault(); setSubscribed(true); }}
            className="flex gap-3 border-b max-w-[380px] mx-auto pb-2"
            style={{ borderColor: `${section.text_color}55` }}
          >
            <input
              type="email"
              required
              placeholder="Email address"
              className="bg-transparent flex-1 text-sm outline-none placeholder:opacity-50"
              style={{ color: section.text_color }}
            />
            <button type="submit" className="font-inter text-xs tracking-wider uppercase shrink-0" style={{ color: theme.accent_color }}>
              {subscribed ? 'Joined ✓' : `${section.button_text || 'Subscribe'} →`}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (section.id === 'instagram') {
    const tiles: (string | null)[] = section.images && section.images.length > 0 ? section.images : Array.from({ length: 6 }, () => null);
    return (
      <section style={{ backgroundColor: section.bg_color, color: section.text_color }} className="py-14 md:py-20">
        <div className="mx-auto px-4 sm:px-5 md:px-14" style={{ maxWidth: theme.container_width }}>
          <div className="text-center mb-10">
            <div className="font-inter text-xs tracking-[0.2em] uppercase opacity-60 mb-2">{section.subtitle}</div>
            <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl mb-2">{section.title}</h2>
            <p className="text-sm opacity-70 max-w-[52ch] mx-auto">{section.description}</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {tiles.map((img, i) => (
              <a
                key={i}
                href={section.button_link || '#'}
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden block"
                style={{ borderRadius: theme.border_radius }}
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${theme.accent_color}55, ${theme.primary_color}22)` }} />
                )}
              </a>
            ))}
          </div>
          {section.button_text && (
            <div className="text-center mt-8">
              <a
                href={section.button_link || '#'}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex font-inter text-xs tracking-[0.14em] uppercase px-8 py-3.5 ${shadowClass(theme)}`}
                style={btnStyle}
              >
                {section.button_text}
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section style={{ backgroundColor: section.bg_color, color: section.text_color }} className="py-14 md:py-20 text-center">
      <div className="mx-auto px-4 sm:px-5" style={{ maxWidth: Math.min(theme.container_width, 720) }}>
        <div className="font-inter text-xs tracking-[0.2em] uppercase opacity-60 mb-3">{section.subtitle}</div>
        <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl mb-4">{section.title}</h2>
        <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-8 max-w-[56ch] mx-auto">{section.description}</p>

        {section.images && section.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {section.images.map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden" style={{ borderRadius: theme.border_radius }}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {section.button_text && section.button_link && (
          <Link
            href={section.button_link}
            className={`inline-flex font-inter text-xs tracking-[0.14em] uppercase px-8 py-3.5 ${shadowClass(theme)}`}
            style={btnStyle}
          >
            {section.button_text}
          </Link>
        )}
      </div>
    </section>
  );
}
