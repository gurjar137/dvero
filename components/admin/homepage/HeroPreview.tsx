import { normalizeHomepageHero } from '@/lib/homepageDefaults';
import { HomepageHero } from '@/lib/types';

const FRAME_WIDTH: Record<string, number> = { desktop: 960, tablet: 520, mobile: 260 };
const FRAME_ASPECT: Record<string, string> = { desktop: 'aspect-[16/8]', tablet: 'aspect-[4/5]', mobile: 'aspect-[9/16]' };

export function HeroPreview({ hero: rawHero, device }: { hero: HomepageHero; device: 'desktop' | 'tablet' | 'mobile' }) {
  const hero = normalizeHomepageHero(rawHero);
  const isNarrow = device !== 'desktop';
  const img = isNarrow && hero.mobile_image ? hero.mobile_image : hero.desktop_image;

  return (
    <div
      className={`mx-auto ${FRAME_ASPECT[device]} overflow-hidden border border-line relative transition-all duration-300`}
      style={{ width: '100%', maxWidth: FRAME_WIDTH[device], backgroundColor: hero.bg_color || '#141210', color: hero.text_color || '#FFFFFF', borderRadius: `${hero.border_radius || 0}px` }}
    >
      {!hero.enabled ? (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <span className="font-oswald text-xs uppercase opacity-50">Hero Disabled</span>
        </div>
      ) : hero.layout === 'split' && !isNarrow ? (
        <div className="grid grid-cols-2 h-full">
          <div className="flex flex-col justify-center px-6 py-4">
            <PreviewText hero={hero} compact />
          </div>
          <div className="relative overflow-hidden">
            {img ? (
              <img src={img} alt="" className="w-full h-full object-cover" style={{ objectPosition: hero.image_position || 'center', transform: `scale(${(hero.image_scale || 100) / 100})` }} />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(200deg, ${hero.bg_color || '#141210'}, #000)` }} />
            )}
            {hero.overlay_opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: hero.overlay_opacity / 100 }} />}
          </div>
        </div>
      ) : (
        <div className="relative h-full flex items-end">
          {img && (
            <img
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: hero.image_position || 'center', transform: `scale(${(hero.image_scale || 100) / 100})` }}
            />
          )}
          {hero.overlay_opacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: hero.overlay_opacity / 100 }} />}
          <div className={`relative z-10 p-5 w-full ${hero.layout === 'center' ? 'text-center flex flex-col items-center h-full justify-center' : ''}`}>
            <PreviewText hero={hero} compact />
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewText({ hero: rawHero }: { hero: HomepageHero; compact?: boolean }) {
  const hero = normalizeHomepageHero(rawHero);
  return (
    <>
      {hero.eyebrow?.enabled && hero.eyebrow.text && (
        <div className="font-inter text-[0.55rem] tracking-[0.18em] uppercase opacity-70 mb-1.5">{hero.eyebrow.text}</div>
      )}
      {hero.mainHeading?.enabled && hero.mainHeading.text && (
        <div className="font-playfair text-base sm:text-lg leading-tight mb-1.5">{hero.mainHeading.text}</div>
      )}
      {hero.subDescription?.enabled && hero.subDescription.text && (
        <div className="font-inter text-[0.6rem] opacity-80 mb-2.5 max-w-[22ch]">{hero.subDescription.text}</div>
      )}
      {hero.cta1?.enabled && hero.cta1.text && (
        <span
          className="inline-flex font-inter text-[0.55rem] tracking-[0.1em] uppercase px-3 py-1.5"
          style={{ backgroundColor: hero.cta1.bgColor || '#FFFFFF', color: hero.cta1.textColor || '#111111' }}
        >
          {hero.cta1.text}
        </span>
      )}
    </>
  );
}
