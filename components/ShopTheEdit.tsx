'use client';
import Link from 'next/link';
import Image from 'next/image';
import { GarmentIcon } from './GarmentIcon';
import { useSettings } from '@/lib/useSettings';
import { useProducts } from '@/lib/useProducts';
import { useState } from 'react';
import { PromoBanner, PromoBannerId } from '@/lib/types';
import { DEFAULT_PROMO_BANNERS } from '@/lib/homepageDefaults';
import { hexToRgba } from '@/lib/utils';
import type { CSSProperties } from 'react';

type Tile = {
  id: PromoBannerId;
  legacyImageId: string;
  href: string;
  iconType: 'shirt' | 'trouser';
  mirrorIcon?: boolean;
  productMatchFilter: (p: any) => boolean;
};

const MENS_COLLECTION: Tile = {
  id: 'mens_collection',
  legacyImageId: 'mens-collection',
  href: '/category/shirts',
  iconType: 'shirt',
  productMatchFilter: p => true,
};

const SHIRTS_TILE: Tile = {
  id: 'shirts',
  legacyImageId: 'formal-shirt',
  href: '/category/shirts',
  iconType: 'shirt',
  productMatchFilter: p => p.category === 'Shirts',
};

const TROUSERS_TILE: Tile = {
  id: 'trousers',
  legacyImageId: 'straight-fit',
  href: '/category/trousers',
  iconType: 'trouser',
  productMatchFilter: p => p.category === 'Trousers',
};

const NEW_ARRIVALS_TILE: Tile = {
  id: 'new_arrivals',
  legacyImageId: 'new-arrivals',
  href: '#drop01',
  iconType: 'shirt',
  productMatchFilter: p => true,
};

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

function useTileImage(tile: Tile, banner: PromoBanner) {
  const { settings } = useSettings();
  const { products } = useProducts();

  const legacyImage = settings.category_images?.[tile.legacyImageId];
  const matchingProduct = products.find(p => tile.productMatchFilter(p) && p.images && p.images.length > 0);
  const legacyProductImage = matchingProduct?.images?.[0];
  const legacyFallback = legacyImage || legacyProductImage || null;

  const desktopSrc = banner.desktop_image || legacyFallback;
  const mobileSrc = banner.mobile_image || desktopSrc;

  return { desktopSrc, mobileSrc };
}

function TileImage({ tile, banner, alt }: { tile: Tile; banner: PromoBanner; alt: string }) {
  const { desktopSrc, mobileSrc } = useTileImage(tile, banner);
  const [desktopError, setDesktopError] = useState(false);
  const [mobileError, setMobileError] = useState(false);

  if (!desktopSrc && !mobileSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <GarmentIcon type={tile.iconType} mirror={tile.mirrorIcon} className="w-2/5 h-2/5 opacity-30" />
      </div>
    );
  }

  return (
    <>
      {desktopSrc && !desktopError && (
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          unoptimized={desktopSrc.startsWith('data:') || desktopSrc.startsWith('blob:')}
          sizes="(max-width: 1023px) 100vw, 50vw"
          onError={() => setDesktopError(true)}
          className="hidden md:block object-cover object-center"
        />
      )}
      {mobileSrc && !mobileError && (
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          unoptimized={mobileSrc.startsWith('data:') || mobileSrc.startsWith('blob:')}
          sizes="100vw"
          onError={() => setMobileError(true)}
          className="block md:hidden object-cover object-center"
        />
      )}
    </>
  );
}

function TileOverlay({ banner }: { banner: PromoBanner }) {
  const gradientDir = banner.vertical_position === 'top' ? 'to bottom' : banner.vertical_position === 'bottom' ? 'to top' : 'to bottom';
  const style: CSSProperties = banner.gradient_enabled
    ? { background: `linear-gradient(${gradientDir}, ${hexToRgba(banner.overlay_color, banner.overlay_opacity)} 0%, transparent 100%)` }
    : { backgroundColor: hexToRgba(banner.overlay_color, banner.overlay_opacity) };

  return <div className="absolute inset-0" style={style} />;
}

function BentoTile({
  tile,
  banner,
  dark,
  className = '',
}: {
  tile: Tile;
  banner: PromoBanner;
  dark?: boolean;
  className?: string;
}) {
  if (!banner.enabled) return null;

  return (
    <Link
      href={banner.button_link || tile.href}
      className={`group relative flex flex-col overflow-hidden min-h-[220px] lg:min-h-0 p-7 md:p-9 transition-colors ${
        dark ? 'bg-ink text-bg' : 'bg-panel2 text-ink'
      } ${JUSTIFY[banner.vertical_position]} ${className}`}
    >
      <TileImage tile={tile} banner={banner} alt={banner.title} />
      <TileOverlay banner={banner} />
      <div className={`relative z-10 flex flex-col ${ALIGN[banner.text_position]}`} style={{ color: banner.text_color }}>
        {banner.subtitle && (
          <div className="font-inter text-[0.68rem] tracking-[0.18em] uppercase opacity-75 mb-2">{banner.subtitle}</div>
        )}
        <h3 className="font-playfair text-2xl md:text-[1.65rem] leading-tight mb-2">{banner.title}</h3>
        {banner.description && (
          <p className="text-[0.8rem] leading-relaxed max-w-[22ch] mb-4 opacity-75">{banner.description}</p>
        )}
        {banner.button_text && (
          <span className="inline-flex items-center gap-2 font-inter text-[0.7rem] tracking-[0.14em] uppercase">
            {banner.button_text}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export function ShopTheEdit() {
  const { settings } = useSettings();
  const banners = { ...DEFAULT_PROMO_BANNERS, ...(settings.promo_banners || {}) };

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-[#FAF9F6]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-14">
        <div className="text-center mb-8 sm:mb-10">
          <div className="font-inter text-xs tracking-[0.25em] uppercase text-[#666666] mb-2">Shop By Style</div>
          <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#111111] uppercase tracking-[0.15em] font-normal">
            Collections
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:grid-rows-[280px_280px]">
          <BentoTile tile={MENS_COLLECTION} banner={banners.mens_collection} dark className="rounded-[12px] lg:col-start-1 lg:row-start-1 lg:row-span-2" />
          <BentoTile tile={SHIRTS_TILE} banner={banners.shirts} className="rounded-[12px] lg:col-start-2 lg:row-start-1" />
          <BentoTile tile={TROUSERS_TILE} banner={banners.trousers} className="rounded-[12px] lg:col-start-2 lg:row-start-2" />
        </div>
      </div>
    </section>
  );
}
