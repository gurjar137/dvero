'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SortOption } from '@/lib/types';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];
const COLORS = ['Ivory', 'Camel', 'Ash Grey', 'Charcoal', 'Stone', 'Navy'];

type ProductFiltersProps = {
  activeCategory?: string;
  totalResults: number;
};

export function ProductFilters({ activeCategory, totalResults }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get('sort') as SortOption) || 'featured';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSizes = searchParams.get('size')?.split(',').filter(Boolean) || [];
  const currentColors = searchParams.get('color')?.split(',').filter(Boolean) || [];

  const [isOpen, setIsOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  function handleSortChange(sort: SortOption) {
    const query = createQueryString('sort', sort === 'featured' ? null : sort);
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }

  function handlePriceChange(min: string, max: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set('minPrice', min); else params.delete('minPrice');
    if (max) params.set('maxPrice', max); else params.delete('maxPrice');
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }

  function handleSizeToggle(size: string) {
    const exists = currentSizes.includes(size);
    const nextSizes = exists ? currentSizes.filter(s => s !== size) : [...currentSizes, size];
    const query = createQueryString('size', nextSizes.length > 0 ? nextSizes.join(',') : null);
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }

  function handleColorToggle(color: string) {
    const exists = currentColors.includes(color);
    const nextColors = exists ? currentColors.filter(c => c !== color) : [...currentColors, color];
    const query = createQueryString('color', nextColors.length > 0 ? nextColors.join(',') : null);
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }

  function clearAllFilters() {
    router.push(pathname, { scroll: false });
  }

  const activeCount = currentSizes.length + currentColors.length + (currentMinPrice || currentMaxPrice ? 1 : 0);
  const hasActiveFilters = activeCount > 0 || currentSort !== 'featured';

  return (
    <div className="mb-6 border-b border-line pb-4 sm:pb-6">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 border border-line px-4 py-2.5 rounded-sm font-oswald text-xs tracking-wider uppercase hover:border-ink transition-colors bg-panel min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <span>Filter {activeCount > 0 && `(${activeCount})`}</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="font-oswald text-xs tracking-wider uppercase text-mute hover:text-ink border-b border-line py-1 min-h-[44px] flex items-center"
            >
              Clear All ×
            </button>
          )}

          <span className="text-mute text-xs font-oswald uppercase tracking-wider hidden sm:inline">
            {totalResults} piece{totalResults !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="font-oswald text-xs tracking-wider uppercase text-mute hidden sm:inline">Sort By:</span>
          <select
            value={currentSort}
            onChange={e => handleSortChange(e.target.value as SortOption)}
            className="bg-panel border border-line px-3 py-2.5 rounded-sm font-oswald text-xs uppercase tracking-wider text-ink outline-none focus:border-ink cursor-pointer min-h-[44px]"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest Drop</option>
          </select>
        </div>
      </div>

      {/* Expandable Filter Panel / Mobile Bottom Sheet Drawer */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-panel p-4 sm:p-6 rounded-md border shadow-sm2 animate-fadeIn">
          {/* Price Filter */}
          <div>
            <h4 className="font-oswald text-xs uppercase tracking-wider text-camelDeep mb-3">Price Range (₹)</h4>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={currentMinPrice}
                onChange={e => handlePriceChange(e.target.value, currentMaxPrice)}
                className="w-full bg-bg border border-line px-3 py-2 rounded-sm text-xs font-mono text-ink outline-none focus:border-ink min-h-[44px]"
              />
              <span className="text-mute text-xs">—</span>
              <input
                type="number"
                placeholder="Max"
                value={currentMaxPrice}
                onChange={e => handlePriceChange(currentMinPrice, e.target.value)}
                className="w-full bg-bg border border-line px-3 py-2 rounded-sm text-xs font-mono text-ink outline-none focus:border-ink min-h-[44px]"
              />
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <h4 className="font-oswald text-xs uppercase tracking-wider text-camelDeep mb-3">Size Selection</h4>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => {
                const active = currentSizes.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => handleSizeToggle(s)}
                    className={`min-w-[44px] min-h-[44px] px-3 py-2 text-xs font-oswald rounded-sm border transition-colors ${
                      active ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <h4 className="font-oswald text-xs uppercase tracking-wider text-camelDeep mb-3">Color Tone</h4>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => {
                const active = currentColors.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => handleColorToggle(c)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-oswald uppercase rounded-sm border transition-colors ${
                      active ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters List */}
          <div>
            <h4 className="font-oswald text-xs uppercase tracking-wider text-camelDeep mb-3">Active Filters</h4>
            <div className="flex flex-wrap gap-1.5">
              {!hasActiveFilters && <span className="text-xs text-mute font-oswald uppercase">None</span>}
              {currentSizes.map(s => (
                <span key={s} className="bg-bg border border-line px-2.5 py-1 rounded text-[0.7rem] font-oswald uppercase">
                  Size: {s}
                </span>
              ))}
              {currentColors.map(c => (
                <span key={c} className="bg-bg border border-line px-2.5 py-1 rounded text-[0.7rem] font-oswald uppercase">
                  Color: {c}
                </span>
              ))}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="bg-bg border border-line px-2.5 py-1 rounded text-[0.7rem] font-oswald uppercase">
                  ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || '∞'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
