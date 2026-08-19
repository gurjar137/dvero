'use client';
import Link from 'next/link';
import { useSettings } from '@/lib/useSettings';
import { normalizeHomepageHero } from '@/lib/homepageDefaults';
import { ElementDeviceConfig } from '@/lib/types';

function getTransform(h: string, v: string) {
  const x = h === 'center' ? '-50%' : h === 'right' ? '-100%' : '0%';
  const y = v === 'center' ? '-50%' : v === 'bottom' ? '-100%' : '0%';
  return `translate(${x}, ${y})`;
}

function getPosVars(desktop: ElementDeviceConfig, mobile: ElementDeviceConfig) {
  return {
    '--x-mob': `${mobile.xPosition}%`,
    '--y-mob': `${mobile.yPosition}%`,
    '--trans-mob': getTransform(mobile.alignHorizontal || 'left', mobile.alignVertical || 'top'),
    '--align-mob': mobile.textAlign || 'left',
    '--size-mob': `${mobile.fontSize || 12}px`,
    '--lh-mob': mobile.lineHeight ? `${mobile.lineHeight}` : '1.2',
    '--mw-mob': mobile.maxWidth ? `${mobile.maxWidth}px` : 'none',

    '--x-desk': `${desktop.xPosition}%`,
    '--y-desk': `${desktop.yPosition}%`,
    '--trans-desk': getTransform(desktop.alignHorizontal || 'left', desktop.alignVertical || 'top'),
    '--align-desk': desktop.textAlign || 'left',
    '--size-desk': `${desktop.fontSize || 14}px`,
    '--lh-desk': desktop.lineHeight ? `${desktop.lineHeight}` : '1.2',
    '--mw-desk': desktop.maxWidth ? `${desktop.maxWidth}px` : 'none',
  } as React.CSSProperties;
}

export function Hero() {
  const { settings } = useSettings();
  const hero = normalizeHomepageHero(settings.homepage_hero);

  if (hero.enabled === false) {
    return null;
  }

  const defaultDesktopImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=85';
  const defaultMobileImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&h=1250&q=85';

  const desktopImage = hero.desktop_image || defaultDesktopImage;
  const mobileImage = hero.mobile_image || defaultMobileImage;
  const overlayOpacity = hero.overlay_opacity !== undefined ? hero.overlay_opacity / 100 : 0.2;

  const { eyebrow, mainHeading, subDescription, cta1, cta2 } = hero;

  return (
    <section className="relative w-full min-h-screen h-[100svh] h-[100dvh] sm:h-auto sm:aspect-[16/9] overflow-hidden bg-[#111111]">
      {/* Dynamic Responsive Styles for Element Positioning */}
      <style jsx>{`
        .hero-positioned-element {
          position: absolute;
          left: var(--x-mob);
          top: var(--y-mob);
          transform: var(--trans-mob);
          text-align: var(--align-mob);
          font-size: var(--size-mob);
          line-height: var(--lh-mob);
          max-width: var(--mw-mob);
        }
        @media (min-width: 640px) {
          .hero-positioned-element {
            left: var(--x-desk);
            top: var(--y-desk);
            transform: var(--trans-desk);
            text-align: var(--align-desk);
            font-size: var(--size-desk);
            line-height: var(--lh-desk);
            max-width: var(--mw-desk);
          }
        }
      `}</style>

      {/* Background Photography with Responsive Picture Tag */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <picture className="w-full h-full block">
          <source media="(min-width: 640px)" srcSet={desktopImage} />
          <source media="(max-width: 639px)" srcSet={mobileImage} />
          <img
            src={desktopImage}
            alt={mainHeading?.text || "D'VERO Modern Retro Menswear"}
            className="w-full h-full object-cover object-center"
          />
        </picture>
        {/* Dark Overlay */}
        <div
          className="absolute inset-0 bg-black pointer-events-none transition-opacity"
          style={{ opacity: overlayOpacity }}
        />
      </div>

      {/* Hero Interactive Elements Canvas */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        {/* Eyebrow */}
        {eyebrow?.enabled && eyebrow.text && (
          <div
            className="hero-positioned-element font-inter uppercase font-medium tracking-[0.3em] pointer-events-auto transition-all duration-150 animate-fadeIn"
            style={{
              ...getPosVars(eyebrow.desktop, eyebrow.mobile),
              color: eyebrow.textColor || '#FFFFFF',
              fontWeight: eyebrow.fontWeight || '500',
              letterSpacing: eyebrow.letterSpacing || '0.3em',
              zIndex: eyebrow.zIndex || 10,
            }}
          >
            {eyebrow.text}
          </div>
        )}

        {/* Main Heading */}
        {mainHeading?.enabled && mainHeading.text && (
          <h1
            className="hero-positioned-element font-playfair uppercase font-normal tracking-[0.1em] drop-shadow-md pointer-events-auto whitespace-pre-wrap transition-all duration-150 animate-fadeIn"
            style={{
              ...getPosVars(mainHeading.desktop, mainHeading.mobile),
              color: mainHeading.textColor || '#FFFFFF',
              fontWeight: mainHeading.fontWeight || '400',
              letterSpacing: mainHeading.letterSpacing || '0.1em',
              zIndex: mainHeading.zIndex || 11,
            }}
          >
            {mainHeading.text}
          </h1>
        )}

        {/* SubDescription */}
        {subDescription?.enabled && subDescription.text && (
          <p
            className="hero-positioned-element font-inter uppercase font-medium tracking-[0.2em] pointer-events-auto whitespace-pre-wrap transition-all duration-150 animate-fadeIn"
            style={{
              ...getPosVars(subDescription.desktop, subDescription.mobile),
              color: subDescription.textColor || '#FFFFFF',
              fontWeight: subDescription.fontWeight || '500',
              letterSpacing: subDescription.letterSpacing || '0.2em',
              zIndex: subDescription.zIndex || 12,
            }}
          >
            {subDescription.text}
          </p>
        )}

        {/* CTA 1 */}
        {cta1?.enabled && cta1.text && (
          <div
            className="hero-positioned-element pointer-events-auto transition-all duration-150 animate-fadeIn"
            style={{
              ...getPosVars(cta1.desktop, cta1.mobile),
              zIndex: cta1.zIndex || 13,
            }}
          >
            <Link
              href={cta1.link || '#featured-collection'}
              className="inline-flex items-center justify-center font-inter uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:opacity-90 active:scale-95 px-6 py-3 sm:px-8 sm:py-4"
              style={{
                color: cta1.textColor || '#111111',
                backgroundColor: cta1.bgColor || '#FFFFFF',
                borderColor: cta1.borderColor || '#FFFFFF',
                borderWidth: `${cta1.borderWidth ?? 1}px`,
                borderRadius: `${cta1.borderRadius ?? 0}px`,
                fontWeight: cta1.fontWeight || '500',
                letterSpacing: cta1.letterSpacing || '0.2em',
                width: cta1.buttonWidth === 'full' ? '100%' : cta1.buttonWidth === 'auto' ? 'auto' : cta1.buttonWidth,
                height: cta1.buttonHeight === 'auto' ? 'auto' : cta1.buttonHeight,
              }}
            >
              {cta1.text}
            </Link>
          </div>
        )}

        {/* CTA 2 */}
        {cta2?.enabled && cta2.text && (
          <div
            className="hero-positioned-element pointer-events-auto transition-all duration-150 animate-fadeIn"
            style={{
              ...getPosVars(cta2.desktop, cta2.mobile),
              zIndex: cta2.zIndex || 14,
            }}
          >
            <Link
              href={cta2.link || '#'}
              className="inline-flex items-center justify-center font-inter uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:opacity-90 active:scale-95 px-6 py-3 sm:px-8 sm:py-4"
              style={{
                color: cta2.textColor || '#FFFFFF',
                backgroundColor: cta2.bgColor || 'transparent',
                borderColor: cta2.borderColor || '#FFFFFF',
                borderWidth: `${cta2.borderWidth ?? 1}px`,
                borderRadius: `${cta2.borderRadius ?? 0}px`,
                fontWeight: cta2.fontWeight || '500',
                letterSpacing: cta2.letterSpacing || '0.2em',
                width: cta2.buttonWidth === 'full' ? '100%' : cta2.buttonWidth === 'auto' ? 'auto' : cta2.buttonWidth,
                height: cta2.buttonHeight === 'auto' ? 'auto' : cta2.buttonHeight,
              }}
            >
              {cta2.text}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

