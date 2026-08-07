'use client';
import { useState, useEffect } from 'react';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';
import { supabase } from '@/lib/supabase/client';
import {
  FeaturedProductsSettings,
  HomepageHero,
  HomepageSettings,
  NavbarSettings,
} from '@/lib/types';
import {
  DEFAULT_FEATURED_PRODUCTS_SETTINGS,
  DEFAULT_HOMEPAGE_HERO,
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_NAVBAR_SETTINGS,
} from '@/lib/homepageDefaults';
import { HeroBannerManager } from '@/components/admin/homepage/HeroBannerManager';
import { FeaturedProductsManager } from '@/components/admin/homepage/FeaturedProductsManager';
import { NavbarSettingsManager } from '@/components/admin/homepage/NavbarSettingsManager';
import { HomepageSettingsManager } from '@/components/admin/homepage/HomepageSettingsManager';

export default function AdminHomepageManagerPage() {
  const { products, settings, loadSettings, loadProducts } = useAdminData();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<'hero' | 'featured' | 'navbar' | 'homepage_settings' | 'galleries'>('hero');

  // Hero Banner Form State
  const [heroForm, setHeroForm] = useState<HomepageHero>(DEFAULT_HOMEPAGE_HERO);
  const [savingHero, setSavingHero] = useState(false);

  // Featured Products Settings State
  const [featuredSettingsForm, setFeaturedSettingsForm] = useState<FeaturedProductsSettings>(
    DEFAULT_FEATURED_PRODUCTS_SETTINGS
  );
  const [savingFeatured, setSavingFeatured] = useState(false);

  // Navbar Settings State
  const [navbarSettingsForm, setNavbarSettingsForm] = useState<NavbarSettings>(DEFAULT_NAVBAR_SETTINGS);
  const [savingNavbar, setSavingNavbar] = useState(false);

  // Homepage Settings State
  const [homepageSettingsForm, setHomepageSettingsForm] = useState<HomepageSettings>(
    DEFAULT_HOMEPAGE_SETTINGS
  );
  const [savingHomepageSettings, setSavingHomepageSettings] = useState(false);

  // Selected Product for Galleries
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [savingProductImg, setSavingProductImg] = useState(false);

  useEffect(() => {
    if (settings.homepage_hero) setHeroForm(settings.homepage_hero);
    if (settings.featured_products_settings) setFeaturedSettingsForm(settings.featured_products_settings);
    if (settings.navbar_settings) setNavbarSettingsForm(settings.navbar_settings);
    if (settings.homepage_settings) setHomepageSettingsForm(settings.homepage_settings);

    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [settings, products, selectedProductId]);

  // Helper to save any key to Supabase settings table & local cache
  async function saveSettingKey(key: string, value: any, successMessage: string) {
    try {
      const { error } = await supabase.from('settings').upsert({ key, value });
      if (error) throw error;

      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        parsed[key] = value;
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }

      showToast(successMessage);
      await loadSettings();
    } catch (e: any) {
      showToast(e.message || `Failed to save ${key}`);
    }
  }

  // Save Hero Banner
  async function handleSaveHero() {
    setSavingHero(true);
    await saveSettingKey('homepage_hero', heroForm, 'Hero Banner saved live!');
    setSavingHero(false);
  }

  // Save Featured Products
  async function handleSaveFeatured() {
    setSavingFeatured(true);
    await saveSettingKey('featured_products_settings', featuredSettingsForm, 'Featured Products saved live!');
    setSavingFeatured(false);
  }

  // Save Navbar Settings
  async function handleSaveNavbar() {
    setSavingNavbar(true);
    await saveSettingKey('navbar_settings', navbarSettingsForm, 'Navbar Settings saved live!');
    setSavingNavbar(false);
  }

  // Save Homepage Settings
  async function handleSaveHomepageSettings() {
    setSavingHomepageSettings(true);
    await saveSettingKey('homepage_settings', homepageSettingsForm, 'Homepage Settings saved live!');
    setSavingHomepageSettings(false);
  }

  // Product Image Gallery Handlers
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
      showToast(`Updated photos for ${selectedProduct.name}`);
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
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-oswald text-2xl uppercase tracking-wider text-ink font-bold">Homepage Manager</h1>
          <p className="text-xs text-mute font-inter mt-1">
            Simplified management for your single Hero Banner, Featured Products, Navbar, and Homepage Layout.
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex gap-2 border-b border-line overflow-x-auto pb-1">
        {[
          { id: 'hero', label: 'Hero Banner Manager' },
          { id: 'featured', label: 'Featured Products' },
          { id: 'navbar', label: 'Navbar Settings' },
          { id: 'homepage_settings', label: 'Homepage Settings' },
          { id: 'galleries', label: 'Product Galleries' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`font-oswald text-xs tracking-wider uppercase px-5 py-3 rounded-t-lg transition-all min-h-[44px] whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-ink text-bg border-t border-x border-line font-bold shadow-sm'
                : 'text-mute hover:text-ink hover:bg-panel'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HERO BANNER MANAGER */}
      {activeTab === 'hero' && (
        <HeroBannerManager
          hero={heroForm}
          onChange={patch => setHeroForm(prev => ({ ...prev, ...patch }))}
          onSave={handleSaveHero}
          saving={savingHero}
        />
      )}

      {/* TAB 2: FEATURED PRODUCTS */}
      {activeTab === 'featured' && (
        <FeaturedProductsManager
          products={products}
          settings={featuredSettingsForm}
          onChange={patch => setFeaturedSettingsForm(prev => ({ ...prev, ...patch }))}
          onSave={handleSaveFeatured}
          saving={savingFeatured}
        />
      )}

      {/* TAB 3: NAVBAR SETTINGS */}
      {activeTab === 'navbar' && (
        <NavbarSettingsManager
          settings={navbarSettingsForm}
          onChange={patch => setNavbarSettingsForm(prev => ({ ...prev, ...patch }))}
          onSave={handleSaveNavbar}
          saving={savingNavbar}
        />
      )}

      {/* TAB 4: HOMEPAGE SETTINGS */}
      {activeTab === 'homepage_settings' && (
        <HomepageSettingsManager
          settings={homepageSettingsForm}
          onChange={patch => setHomepageSettingsForm(prev => ({ ...prev, ...patch }))}
          onSave={handleSaveHomepageSettings}
          saving={savingHomepageSettings}
        />
      )}

      {/* TAB 5: PRODUCT GALLERIES */}
      {activeTab === 'galleries' && (
        <div className="bg-panel border border-line rounded-xl p-6 sm:p-8 shadow-sm2 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
            <div>
              <h2 className="font-oswald text-lg uppercase font-semibold text-ink">Product Image Gallery Manager</h2>
              <p className="text-xs text-mute font-inter mt-1">
                Upload photos, set main image thumbnail, and adjust photo order for products.
              </p>
            </div>

            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="bg-bg border border-line px-4 py-2 rounded-lg font-oswald text-xs uppercase text-ink outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct ? (
            <div className="bg-bg border border-line rounded-xl p-6 space-y-6 shadow-xs">
              <div className="flex justify-between items-center border-b border-line pb-4 flex-wrap gap-3">
                <div>
                  <h3 className="font-oswald text-base uppercase text-ink font-bold">{selectedProduct.name}</h3>
                  <p className="text-xs text-mute font-inter">
                    {selectedProduct.fabric || 'Standard Fabric'} · {selectedProduct.category}
                  </p>
                </div>
                <label className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-camelDeep cursor-pointer transition-colors min-h-[44px] flex items-center font-semibold shadow-sm">
                  + Upload Product Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && addProductImageFile(e.target.files[0])}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedProduct.images?.map((img, i) => (
                  <div key={i} className="bg-panel border border-line rounded-lg p-3 space-y-2 relative group">
                    <div className="aspect-[3/4] bg-bg border border-line rounded overflow-hidden flex items-center justify-center relative">
                      <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-oswald text-[0.65rem] uppercase text-mute font-semibold">
                        {i === 0 ? 'Main Photo' : `Gallery #${i + 1}`}
                      </span>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsMainImage(i)}
                          className="font-oswald text-[0.65rem] uppercase text-camelDeep underline font-semibold"
                        >
                          Set Main
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProductImage(i)}
                      className="w-full text-center bg-error/10 text-error font-oswald text-[0.68rem] uppercase py-1.5 rounded border border-error/20 font-semibold"
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
