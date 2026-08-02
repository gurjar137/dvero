'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useProducts } from '@/lib/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilters } from '@/components/ProductFilters';
import { CollectionSkeleton } from '@/components/CollectionSkeleton';
import { SortOption } from '@/lib/types';

const PANT_FITS = [
  { slug: 'straight-fit', label: 'Straight Fit' },
  { slug: 'boot-cut', label: 'Boot Cut' },
  { slug: 'baggy', label: 'Baggy Fit' },
  { slug: 'office-fit', label: 'Office Fit' }
];

const ABOVE_FOLD_COUNT = 4;

export function CategoryView({ slug, fit }: { slug: string; fit?: string }) {
  const { products, stockFor, loading } = useProducts();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());

  const currentSort = (searchParams.get('sort') as SortOption) || 'featured';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
  const selectedSizes = searchParams.get('size')?.split(',').filter(Boolean) || [];
  const selectedColors = searchParams.get('color')?.split(',').filter(Boolean) || [];

  const categoryName = slug === 'trousers' ? 'Trousers' : slug === 'shirts' ? 'Shirts' : 'Collection';

  // Base category filtering
  let filtered = products.filter(p => {
    if (slug === 'trousers' || slug === 'shirts') {
      return p.category.toLowerCase() === slug;
    }
    return true;
  });

  if (fit) {
    filtered = filtered.filter(p => p.fit_slug === fit);
  }

  // Apply Price Filters
  if (minPrice !== null) {
    filtered = filtered.filter(p => p.price >= minPrice);
  }
  if (maxPrice !== null) {
    filtered = filtered.filter(p => p.price <= maxPrice);
  }

  // Apply Size Filter (matches if product has ANY of selected sizes)
  if (selectedSizes.length > 0) {
    filtered = filtered.filter(p => p.sizes.some(s => selectedSizes.includes(s)));
  }

  // Apply Color Filter (matches if fabric/description contains selected colors)
  if (selectedColors.length > 0) {
    filtered = filtered.filter(p => {
      const text = `${p.fabric || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
      return selectedColors.some(c => text.includes(c.toLowerCase()));
    });
  }

  // Apply Sorting
  filtered = [...filtered].sort((a, b) => {
    if (currentSort === 'price-asc') return a.price - b.price;
    if (currentSort === 'price-desc') return b.price - a.price;
    if (currentSort === 'newest') return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0);
    return 0; // featured
  });

  const heading = fit
    ? (PANT_FITS.find(f => f.slug === fit)?.label || filtered[0]?.fit_type || 'Trousers') + ' Trousers'
    : categoryName;

  // The set of cards that must finish painting before we can safely reveal the grid.
  const aboveFold = filtered.slice(0, ABOVE_FOLD_COUNT);
  const aboveFoldKey = aboveFold.map(p => p.id).join('|');

  // Reset image-readiness tracking whenever the above-the-fold set changes
  // (new category, new filters, new sort order).
  useEffect(() => {
    setLoadedImageIds(new Set());
  }, [aboveFoldKey]);

  function markImageReady(id: string) {
    setLoadedImageIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  const imagesReady = aboveFold.length === 0 || aboveFold.every(p => loadedImageIds.has(p.id));

  // Never true until: fetch finished AND state updated AND above-the-fold images have painted.
  const contentReady = !loading && imagesReady;

  return (
    <main className="page-fade py-10 md:py-16 min-h-[50vh]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Skeleton and real content occupy the same grid cell and crossfade;
            neither is ever unmounted, so there is no gap between them. */}
        <div className="grid">
          <div
            className={`[grid-area:1/1] transition-opacity duration-200 ease-out ${
              contentReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-hidden={contentReady}
          >
            <CollectionSkeleton />
          </div>

          <div
            className={`[grid-area:1/1] transition-opacity duration-200 ease-out ${
              contentReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!contentReady}
          >
            <div className="flex justify-between items-end gap-8 mb-6 flex-wrap">
              <div>
                <h1 className="font-oswald text-2xl sm:text-3xl md:text-4xl uppercase">{heading}</h1>
                <p className="text-mute text-sm mt-2">{filtered.length} piece{filtered.length !== 1 ? 's' : ''} in this edit.</p>
              </div>
              <Link href={`/category/${slug}`} className="font-oswald text-xs tracking-wider uppercase border-b border-ink">
                Reset Filters ×
              </Link>
            </div>

            {slug === 'trousers' && (
              <div className="flex gap-3 flex-wrap mb-9">
                <Link
                  href="/category/trousers"
                  className={`font-oswald text-xs tracking-wider uppercase px-4 py-2 rounded-full border ${
                    !fit ? 'bg-ink text-bg border-ink' : 'border-line text-mute hover:border-ink hover:text-ink'
                  }`}
                >
                  All Trousers
                </Link>
                {PANT_FITS.map(f => (
                  <Link
                    key={f.slug}
                    href={`/category/trousers/${f.slug}`}
                    className={`font-oswald text-xs tracking-wider uppercase px-4 py-2 rounded-full border ${
                      fit === f.slug ? 'bg-ink text-bg border-ink' : 'border-line text-mute hover:border-ink hover:text-ink'
                    }`}
                  >
                    {f.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Filters Bar Component */}
            <ProductFilters activeCategory={slug} totalResults={filtered.length} />

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-oswald text-xl uppercase mb-2 text-ink">No Pieces Found</p>
                <p className="text-mute text-sm max-w-[32ch] mx-auto mb-6">
                  Try adjusting your price range, size, or color filters to explore the rest of the collection.
                </p>
                <Link href={pathname} className="font-oswald text-xs tracking-widest uppercase bg-ink text-bg px-6 py-3 rounded-sm hover:bg-camelDeep inline-block">
                  Clear All Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    mirror={i % 2 === 1}
                    stockFor={stockFor}
                    priority={i < ABOVE_FOLD_COUNT}
                    onImageReady={i < ABOVE_FOLD_COUNT ? () => markImageReady(p.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
