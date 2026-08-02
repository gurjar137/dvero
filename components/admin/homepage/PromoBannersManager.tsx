'use client';
import { PromoBanner, PromoBannerId, PromoBanners } from '@/lib/types';
import { PromoBannerEditor } from './PromoBannerEditor';

const BANNER_LABELS: Record<PromoBannerId, string> = {
  mens_collection: "Men's Collection",
  shirts: 'Shirts',
  trousers: 'Trousers',
  new_arrivals: 'New Arrivals',
};

const BANNER_ORDER: PromoBannerId[] = ['mens_collection', 'shirts', 'trousers', 'new_arrivals'];

export function PromoBannersManager({
  banners,
  onChange,
  onSave,
  savingId,
}: {
  banners: PromoBanners;
  onChange: (id: PromoBannerId, patch: Partial<PromoBanner>) => void;
  onSave: (id: PromoBannerId) => void;
  savingId: PromoBannerId | null;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-oswald text-lg uppercase text-ink">Promotional Banners</h2>
        <p className="text-xs text-mute mt-1">
          Manage the four homepage promo tiles — Men&rsquo;s Collection, Shirts, Trousers and New Arrivals — independently. Each saves on its own.
        </p>
      </div>

      {BANNER_ORDER.map(id => (
        <PromoBannerEditor
          key={id}
          label={BANNER_LABELS[id]}
          banner={banners[id]}
          onChange={patch => onChange(id, patch)}
          onSave={() => onSave(id)}
          saving={savingId === id}
        />
      ))}
    </div>
  );
}
