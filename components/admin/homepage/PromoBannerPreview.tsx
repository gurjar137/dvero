'use client';
import { PromoBanner } from '@/lib/types';
import { hexToRgba } from '@/lib/utils';
import type { CSSProperties } from 'react';

const JUSTIFY: Record<PromoBanner['vertical_position'], string> = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end',
};

const ALIGN: Record<PromoBanner['text_position'], string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export function PromoBannerPreview({ banner, device }: { banner: PromoBanner; device: 'desktop' | 'mobile' }) {
  const img = device === 'mobile' ? (banner.mobile_image || banner.desktop_image) : banner.desktop_image;
  const gradientDir = banner.vertical_position === 'top' ? 'to bottom' : banner.vertical_position === 'bottom' ? 'to top' : 'to bottom';
  const overlayStyle: CSSProperties = banner.gradient_enabled
    ? { background: `linear-gradient(${gradientDir}, ${hexToRgba(banner.overlay_color, banner.overlay_opacity)} 0%, transparent 100%)` }
    : { backgroundColor: hexToRgba(banner.overlay_color, banner.overlay_opacity) };

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden border border-line rounded ${device === 'mobile' ? 'aspect-[4/5] max-w-[220px]' : 'aspect-video max-w-[560px]'}`}
    >
      {!banner.enabled ? (
        <div className="absolute inset-0 flex items-center justify-center bg-panel">
          <span className="font-oswald text-xs uppercase text-mute opacity-70">Banner Disabled</span>
        </div>
      ) : (
        <>
          {img ? (
            <img src={img} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-panel flex items-center justify-center">
              <span className="text-[0.65rem] font-oswald uppercase text-mute">No Image Set</span>
            </div>
          )}
          <div className="absolute inset-0" style={overlayStyle} />
          <div className={`relative z-10 h-full w-full flex flex-col p-4 ${JUSTIFY[banner.vertical_position]}`}>
            <div className={`flex flex-col w-full ${ALIGN[banner.text_position]}`} style={{ color: banner.text_color }}>
              {banner.subtitle && (
                <span className="font-inter text-[0.55rem] tracking-[0.18em] uppercase opacity-80 mb-1.5">{banner.subtitle}</span>
              )}
              {banner.title && <span className="font-playfair text-base sm:text-lg leading-tight mb-1.5">{banner.title}</span>}
              {banner.description && (
                <span className="font-inter text-[0.6rem] opacity-80 mb-2.5 max-w-[24ch]">{banner.description}</span>
              )}
              {banner.button_text && (
                <span
                  className="inline-flex font-inter text-[0.55rem] tracking-[0.1em] uppercase px-3 py-1.5"
                  style={{ backgroundColor: banner.text_color, color: banner.overlay_color }}
                >
                  {banner.button_text}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
