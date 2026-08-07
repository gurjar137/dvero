'use client';
import { useState } from 'react';
import { Product, FeaturedProductsSettings } from '@/lib/types';
import { ToggleSwitch } from '@/components/admin/FormPrimitives';
import { formatINR } from '@/lib/utils';

interface FeaturedProductsManagerProps {
  products: Product[];
  settings: FeaturedProductsSettings;
  onChange: (patch: Partial<FeaturedProductsSettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function FeaturedProductsManager({
  products,
  settings,
  onChange,
  onSave,
  saving,
}: FeaturedProductsManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Currently selected featured product objects in order
  const featuredProductIds = settings.product_ids || [];
  const featuredProducts = featuredProductIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => Boolean(p));

  // Available products for selection (not yet added to featured)
  const unselectedProducts = products.filter(
    p => !featuredProductIds.includes(p.id) && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    )
  );

  function toggleProductSelection(productId: string) {
    if (featuredProductIds.includes(productId)) {
      onChange({ product_ids: featuredProductIds.filter(id => id !== productId) });
    } else {
      onChange({ product_ids: [...featuredProductIds, productId] });
    }
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= featuredProductIds.length) return;
    const copy = [...featuredProductIds];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    onChange({ product_ids: copy });
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Control Header */}
      <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-lg uppercase font-semibold text-ink tracking-wide">Featured Products</h2>
          <p className="text-xs text-mute font-inter mt-0.5">
            Curate and reorder products displayed in the &quot;Featured Collection&quot; section on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-lg border border-line">
            <span className="text-xs font-oswald uppercase text-mute">Enable Section</span>
            <ToggleSwitch
              label={settings.enabled ? 'ON' : 'OFF'}
              checked={settings.enabled}
              onChange={v => onChange({ enabled: v })}
            />
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-camelDeep transition-all duration-200 min-h-[44px] flex items-center font-semibold shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Featured Products'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selected Featured Products Drag & Drop Sorting */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-oswald text-sm uppercase font-semibold text-ink">
                Selected Featured Products ({featuredProducts.length})
              </h3>
              <span className="text-xs text-mute font-inter">Drag or use arrows to reorder</span>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-line rounded-lg text-mute">
                <p className="font-oswald text-xs uppercase tracking-wider">No featured products selected</p>
                <p className="text-[0.7rem] font-inter mt-1">Select products from the catalog panel on the right.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== index) {
                        moveItem(dragIndex, index);
                      }
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-3 bg-panel border border-line rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-ink/40 transition-all ${
                      dragIndex === index ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    {/* Drag Handle Icon */}
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-mute shrink-0">
                      <circle cx="6" cy="5" r="1.3" fill="currentColor" />
                      <circle cx="6" cy="10" r="1.3" fill="currentColor" />
                      <circle cx="6" cy="15" r="1.3" fill="currentColor" />
                      <circle cx="14" cy="5" r="1.3" fill="currentColor" />
                      <circle cx="14" cy="10" r="1.3" fill="currentColor" />
                      <circle cx="14" cy="15" r="1.3" fill="currentColor" />
                    </svg>

                    {/* Rank Badge */}
                    <span className="w-6 h-6 rounded-full bg-ink text-bg font-oswald text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Product Image Thumbnail */}
                    <div className="w-10 h-12 bg-bg border border-line rounded overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[0.5rem] font-oswald uppercase text-mute">
                          No Img
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-oswald text-xs font-semibold text-ink uppercase truncate">{product.name}</div>
                      <div className="text-[0.68rem] text-mute flex gap-2">
                        <span>{product.category}</span>
                        <span>•</span>
                        <span className="text-camelDeep font-mono font-semibold">{formatINR(product.price)}</span>
                      </div>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                        aria-label="Move item up"
                        className="p-1.5 rounded border border-line bg-bg text-ink disabled:opacity-30 hover:bg-panel text-xs"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === featuredProducts.length - 1}
                        aria-label="Move item down"
                        className="p-1.5 rounded border border-line bg-bg text-ink disabled:opacity-30 hover:bg-panel text-xs"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductSelection(product.id)}
                        className="p-1.5 text-xs text-error font-oswald uppercase hover:underline ml-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Catalog Picker Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-oswald text-sm uppercase font-semibold text-ink">Catalog Product Picker</h3>
              <span className="text-xs text-mute font-mono">{unselectedProducts.length} available</span>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search catalog products..."
              className="w-full bg-panel border border-line px-3.5 py-2 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
            />

            {/* Product List */}
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {unselectedProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-panel border border-line/60 hover:border-ink rounded-lg p-2.5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-10 bg-bg border border-line rounded overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-mute">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-oswald text-xs uppercase font-medium text-ink truncate">{product.name}</div>
                      <div className="text-[0.65rem] font-mono text-camelDeep">{formatINR(product.price)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleProductSelection(product.id)}
                    className="border border-ink bg-ink text-bg font-oswald text-[0.65rem] uppercase px-3 py-1.5 rounded hover:bg-camelDeep transition-colors shrink-0 font-semibold"
                  >
                    + Add
                  </button>
                </div>
              ))}

              {unselectedProducts.length === 0 && (
                <div className="text-center py-8 text-xs text-mute font-inter">
                  No matching unselected products found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
