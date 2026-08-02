'use client';
import { useState, useEffect, useRef } from 'react';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';
import { supabase } from '@/lib/supabase/client';
import { HomepageHero, HomepageSection, HomepageTheme, PromoBannerId, PromoBanners } from '@/lib/types';
import { GarmentIcon, ProductVisual } from '@/components/GarmentIcon';
import { DEFAULT_HOMEPAGE_HERO, DEFAULT_HOMEPAGE_SECTIONS, DEFAULT_HOMEPAGE_THEME, DEFAULT_PROMO_BANNERS } from '@/lib/homepageDefaults';
import { HeroEditor } from '@/components/admin/homepage/HeroEditor';
import { HeroPreview } from '@/components/admin/homepage/HeroPreview';
import { SectionsManager } from '@/components/admin/homepage/SectionsManager';
import { ThemeEditor } from '@/components/admin/homepage/ThemeEditor';
import { PromoBannersManager } from '@/components/admin/homepage/PromoBannersManager';

const CATEGORY_KEYS = [
  { id: 'formal-shirt', name: 'Formal Shirts', type: 'shirt' as const },
  { id: 'casual-shirt', name: 'Casual Shirts', type: 'shirt' as const },
  { id: 'premium-shirt', name: 'Premium Shirts', type: 'shirt' as const },
  { id: 'straight-fit', name: 'Straight Fit', type: 'trouser' as const },
  { id: 'bootcut', name: 'Boot Cut', type: 'trouser' as const, mirror: true },
  { id: 'baggy-fit', name: 'Baggy Fit', type: 'trouser' as const },
  { id: 'office-fit', name: 'Office Fit', type: 'trouser' as const, mirror: true },
];

export default function AdminMediaManagerPage() {
  const { products, settings, loadSettings, loadProducts, loaded } = useAdminData();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<'homepage' | 'promo' | 'category' | 'product'>('homepage');

  const [heroForm, setHeroForm] = useState<HomepageHero>(DEFAULT_HOMEPAGE_HERO);
  const [sectionsForm, setSectionsForm] = useState<HomepageSection[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [themeForm, setThemeForm] = useState<HomepageTheme>(DEFAULT_HOMEPAGE_THEME);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [savingHomepage, setSavingHomepage] = useState(false);

  const [promoBannersForm, setPromoBannersForm] = useState<PromoBanners>(DEFAULT_PROMO_BANNERS);
  const [savingPromoBannerId, setSavingPromoBannerId] = useState<PromoBannerId | null>(null);

  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [savingProductImg, setSavingProductImg] = useState(false);

  useEffect(() => {
    if (settings.homepage_hero) setHeroForm(settings.homepage_hero);
    if (settings.homepage_sections) setSectionsForm(settings.homepage_sections);
    if (settings.homepage_theme) setThemeForm(settings.homepage_theme);
    if (settings.promo_banners) setPromoBannersForm({ ...DEFAULT_PROMO_BANNERS, ...settings.promo_banners });
    if (settings.category_images) setCategoryImages(settings.category_images);
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [settings, products, selectedProductId]);

  async function saveHomepage(toastLabel: string) {
    setSavingHomepage(true);
    try {
      const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
        supabase.from('settings').upsert({ key: 'homepage_hero', value: heroForm }),
        supabase.from('settings').upsert({ key: 'homepage_sections', value: sectionsForm }),
        supabase.from('settings').upsert({ key: 'homepage_theme', value: themeForm }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;

      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        parsed.homepage_hero = heroForm;
        parsed.homepage_sections = sectionsForm;
        parsed.homepage_theme = themeForm;
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }

      showToast(toastLabel);
      await loadSettings();
    } catch (e: any) {
      showToast(e.message || 'Failed to save homepage');
    } finally {
      setSavingHomepage(false);
    }
  }

  function resetHomepage() {
    setHeroForm(settings.homepage_hero || DEFAULT_HOMEPAGE_HERO);
    setSectionsForm(settings.homepage_sections || DEFAULT_HOMEPAGE_SECTIONS);
    setThemeForm(settings.homepage_theme || DEFAULT_HOMEPAGE_THEME);
    showToast('Changes reset to last saved version');
  }

  function patchPromoBanner(id: PromoBannerId, patch: Partial<PromoBanners[PromoBannerId]>) {
    setPromoBannersForm(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function savePromoBanner(id: PromoBannerId) {
    setSavingPromoBannerId(id);
    try {
      const { error } = await supabase.from('settings').upsert({ key: 'promo_banners', value: promoBannersForm });
      if (error) throw error;

      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        parsed.promo_banners = promoBannersForm;
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }

      showToast(`${id === 'mens_collection' ? "Men's Collection" : id === 'shirts' ? 'Shirts' : id === 'trousers' ? 'Trousers' : 'New Arrivals'} banner saved!`);
      await loadSettings();
    } catch (e: any) {
      showToast(e.message || 'Failed to save banner');
    } finally {
      setSavingPromoBannerId(null);
    }
  }

  async function saveCategoryImages() {
    setSavingCategory(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'category_images',
        value: categoryImages,
      });
      if (error) throw error;

      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        parsed.category_images = categoryImages;
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }

      showToast('Shop The Edit category images saved!');
      await loadSettings();
    } catch (e: any) {
      showToast(e.message || 'Failed to save category images');
    } finally {
      setSavingCategory(false);
    }
  }

  function handleCatFileUpload(catId: string, file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setCategoryImages(prev => ({ ...prev, [catId]: e.target!.result as string }));
        showToast(`Image loaded for ${catId}`);
      }
    };
    reader.readAsDataURL(file);
  }

  // -------------------------------------------------------------
  // PRODUCT IMAGES HANDLERS
  // -------------------------------------------------------------
  const selectedProduct = products.find(p => p.id === selectedProductId);

  async function saveProductImages(newImages: string[]) {
    if (!selectedProduct) return;
    setSavingProductImg(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', selectedProduct.id);

      if (error) throw error;
      showToast(`Updated images for ${selectedProduct.name}`);
      await loadProducts();
    } catch (e: any) {
      showToast(e.message || 'Failed to update product images');
    } finally {
      setSavingProductImg(false);
    }
  }

  function addProductImageFile(file: File) {
    if (!selectedProduct) return;
    const reader = new FileReader();
    reader.onload = async e => {
      if (e.target?.result) {
        const nextImgs = [...(selectedProduct.images || []), e.target.result as string];
        await saveProductImages(nextImgs);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeProductImage(index: number) {
    if (!selectedProduct) return;
    const nextImgs = selectedProduct.images.filter((_, i) => i !== index);
    saveProductImages(nextImgs);
  }

  function setAsMainImage(index: number) {
    if (!selectedProduct || index === 0) return;
    const imgs = [...selectedProduct.images];
    const target = imgs.splice(index, 1)[0];
    imgs.unshift(target);
    saveProductImages(imgs);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Title */}
      <div className="flex justify-between items-end flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-oswald text-2xl uppercase text-ink">Homepage Manager</h1>
          <p className="text-sm text-mute mt-1">
            Design the live D&rsquo;VERO homepage — hero, sections, theme and product media — from one dashboard.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-line overflow-x-auto pb-1">
        {[
          { id: 'homepage', label: 'Homepage Manager' },
          { id: 'promo', label: 'Promotional Banners' },
          { id: 'category', label: 'Category Images' },
          { id: 'product', label: 'Product Galleries' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`font-oswald text-xs tracking-wider uppercase px-5 py-3 rounded-t-md transition-colors min-h-[44px] whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-ink text-bg border-t border-x border-line font-semibold'
                : 'text-mute hover:text-ink hover:bg-panel'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: HOMEPAGE MANAGER */}
      {activeTab === 'homepage' && (
        <div className="space-y-8">
          <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border border-line rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm2">
            <p className="text-xs text-mute">Changes apply to the live homepage as soon as you save or publish.</p>
            <div className="flex gap-3">
              <button
                onClick={resetHomepage}
                className="border border-line bg-panel text-ink font-oswald text-xs uppercase px-5 py-2.5 rounded hover:border-ink transition-colors min-h-[44px]"
              >
                Reset
              </button>
              <button
                onClick={() => saveHomepage('Homepage changes saved!')}
                disabled={savingHomepage}
                className="border border-ink bg-bg text-ink font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-panel transition-colors min-h-[44px]"
              >
                {savingHomepage ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => saveHomepage('Homepage published live!')}
                disabled={savingHomepage}
                className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
              >
                {savingHomepage ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <HeroEditor hero={heroForm} onChange={patch => setHeroForm(prev => ({ ...prev, ...patch }))} />

          <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
            <div className="flex justify-between items-center flex-wrap gap-3 border-b border-line pb-3">
              <h3 className="font-oswald text-sm uppercase font-semibold text-ink">6. Hero Preview</h3>
              <div className="flex gap-2">
                {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setPreviewDevice(d)}
                    className={`font-oswald text-[0.68rem] uppercase px-4 py-2 rounded border transition-colors ${
                      previewDevice === d ? 'bg-ink text-bg border-ink' : 'border-line text-mute hover:border-ink hover:text-ink'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-panel rounded-lg p-6 flex justify-center overflow-x-auto">
              <HeroPreview hero={heroForm} device={previewDevice} />
            </div>
            <p className="text-[0.68rem] text-mute text-center">Live Preview — reflects unsaved edits above in real time.</p>
          </div>

          <SectionsManager sections={sectionsForm} onChange={setSectionsForm} />

          <ThemeEditor theme={themeForm} onChange={patch => setThemeForm(prev => ({ ...prev, ...patch }))} />

          <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink">7. Save</h3>
            <div className="flex gap-3">
              <button
                onClick={resetHomepage}
                className="border border-line bg-panel text-ink font-oswald text-xs uppercase px-5 py-2.5 rounded hover:border-ink transition-colors min-h-[44px]"
              >
                Reset
              </button>
              <button
                onClick={() => saveHomepage('Homepage changes saved!')}
                disabled={savingHomepage}
                className="border border-ink bg-bg text-ink font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-panel transition-colors min-h-[44px]"
              >
                {savingHomepage ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => saveHomepage('Homepage published live!')}
                disabled={savingHomepage}
                className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
              >
                {savingHomepage ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PROMOTIONAL BANNERS */}
      {activeTab === 'promo' && (
        <PromoBannersManager
          banners={promoBannersForm}
          onChange={patchPromoBanner}
          onSave={savePromoBanner}
          savingId={savingPromoBannerId}
        />
      )}

      {/* TAB: CATEGORY IMAGES */}
      {activeTab === 'category' && (
        <div className="bg-panel border border-line rounded-xl p-6 sm:p-8 shadow-sm2 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
            <div>
              <h2 className="font-oswald text-lg uppercase text-ink">Shop The Edit — Category Photos</h2>
              <p className="text-xs text-mute mt-1">Upload or assign image URLs for each formalwear category card.</p>
            </div>
            <button
              onClick={saveCategoryImages}
              disabled={savingCategory}
              className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
            >
              {savingCategory ? 'Saving...' : 'Save Category Photos'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORY_KEYS.map(cat => {
              const currentImg = categoryImages[cat.id] || '';
              return (
                <div key={cat.id} className="bg-bg border border-line rounded-lg p-4 space-y-3 shadow-sm2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <GarmentIcon type={cat.type} mirror={cat.mirror} className="w-5 h-5 text-camelDeep" />
                      <span className="font-oswald text-sm uppercase font-semibold text-ink">{cat.name}</span>
                    </div>
                  </div>

                  <div className="w-full h-36 bg-panel border border-line rounded flex items-center justify-center overflow-hidden relative">
                    {currentImg ? (
                      <img src={currentImg} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3">
                        <GarmentIcon type={cat.type} mirror={cat.mirror} className="w-8 h-8 text-mute/50 mx-auto mb-1" />
                        <span className="text-[0.65rem] font-oswald uppercase text-mute">Database Auto Fallback</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentImg}
                      onChange={e => setCategoryImages(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder="Image URL (http...)"
                      className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none"
                    />

                    <label className="block text-center border border-line bg-panel hover:bg-line text-ink font-oswald text-[0.68rem] uppercase py-2 rounded cursor-pointer">
                      Upload Photo File
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCatFileUpload(cat.id, e.target.files[0])} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: PRODUCT GALLERIES */}
      {activeTab === 'product' && (
        <div className="bg-panel border border-line rounded-xl p-6 sm:p-8 shadow-sm2 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
            <div>
              <h2 className="font-oswald text-lg uppercase text-ink">Product Image Gallery Manager</h2>
              <p className="text-xs text-mute mt-1">Manage main image, gallery images, hover preview, and order for any garment.</p>
            </div>

            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="bg-bg border border-line px-4 py-2 rounded font-oswald text-xs uppercase text-ink outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>

          {selectedProduct ? (
            <div className="bg-bg border border-line rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-line pb-3">
                <div>
                  <h3 className="font-oswald text-base uppercase text-ink font-semibold">{selectedProduct.name}</h3>
                  <p className="text-xs text-mute">{selectedProduct.fabric} · {selectedProduct.category}</p>
                </div>
                <label className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-5 py-2.5 rounded hover:bg-camelDeep cursor-pointer transition-colors min-h-[44px] flex items-center">
                  + Upload New Product Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && addProductImageFile(e.target.files[0])} />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedProduct.images?.map((img, i) => (
                  <div key={i} className="bg-panel border border-line rounded-lg p-3 space-y-2 relative group">
                    <div className="aspect-[3/4] bg-bg border border-line rounded overflow-hidden flex items-center justify-center">
                      <ProductVisual image={img} type={selectedProduct.type} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-oswald text-[0.65rem] uppercase text-mute">
                        {i === 0 ? 'Main Photo' : `Gallery #${i + 1}`}
                      </span>
                      {i !== 0 && (
                        <button
                          onClick={() => setAsMainImage(i)}
                          className="font-oswald text-[0.65rem] uppercase text-camelDeep underline"
                        >
                          Set Main
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => removeProductImage(i)}
                      className="w-full text-center bg-error/10 text-error font-oswald text-[0.68rem] uppercase py-1.5 rounded border border-error/20"
                    >
                      Delete Photo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-mute font-oswald uppercase text-xs">No product selected</div>
          )}
        </div>
      )}
    </div>
  );
}
