'use client';
import { useState, useEffect } from 'react';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';
import { supabase } from '@/lib/supabase/client';
import { GarmentIcon } from '@/components/GarmentIcon';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
};

const EDITORIAL_CATEGORIES = [
  { id: 'formal-shirt', name: 'Formal Shirts', type: 'shirt' as const },
  { id: 'casual-shirt', name: 'Casual Shirts', type: 'shirt' as const },
  { id: 'premium-shirt', name: 'Premium Shirts', type: 'shirt' as const },
  { id: 'straight-fit', name: 'Straight Fit', type: 'trouser' as const },
  { id: 'bootcut', name: 'Boot Cut', type: 'trouser' as const, mirror: true },
  { id: 'baggy-fit', name: 'Baggy Fit', type: 'trouser' as const },
  { id: 'office-fit', name: 'Office Fit', type: 'trouser' as const, mirror: true },
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Shirts', slug: 'shirts', description: 'Luxury collarless, relaxed, and formal tailored shirts', featured: true },
  { id: '2', name: 'Trousers', slug: 'trousers', description: 'Straight fit, boot cut, baggy, and office formal trousers', featured: true },
  { id: '3', name: 'Straight Fit Trousers', slug: 'straight-fit', description: 'Classic straight cut leg with mid-rise waist', featured: false },
  { id: '4', name: 'Boot Cut Trousers', slug: 'boot-cut', description: 'Slight flare from knee down with high-rise waist', featured: false },
  { id: '5', name: 'Baggy Fit Trousers', slug: 'baggy', description: 'Maximum room through leg with wide drape', featured: false },
  { id: '6', name: 'Office Fit Trousers', slug: 'office-fit', description: 'Tailored straight formal cut for executive wear', featured: false },
];

export default function AdminCategoriesPage() {
  const { products, settings, loadSettings } = useAdminData();
  const showToast = useToast();
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [savingImages, setSavingImages] = useState(false);

  useEffect(() => {
    if (settings.category_images) {
      setCategoryImages(settings.category_images);
    }
  }, [settings]);

  async function handleSaveCategoryImages() {
    setSavingImages(true);
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
      showToast('Shop The Edit category images updated in database!');
      await loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Error saving category images');
    } finally {
      setSavingImages(false);
    }
  }

  function handleImageChange(id: string, url: string) {
    setCategoryImages(prev => ({
      ...prev,
      [id]: url,
    }));
  }

  function handleFileUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        handleImageChange(id, result);
        showToast(`Image loaded for ${id}. Click 'Save Category Photos' to update database.`);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const newCat: CategoryItem = {
      id: String(Date.now()),
      name: name.trim(),
      slug,
      description: description.trim(),
      featured,
    };
    setCategories([...categories, newCat]);
    setName('');
    setDescription('');
    setFeatured(false);
    setShowModal(false);
    showToast('Category created successfully');
  }

  function toggleFeatured(id: string) {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, featured: !c.featured } : c))
    );
    showToast('Category status updated');
  }

  function deleteCategory(id: string) {
    if (!confirm('Remove this category from directory?')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category deleted');
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-oswald text-2xl uppercase text-ink">Category Management</h1>
          <p className="text-sm text-mute mt-1">Organize products, category photography, and Shop The Edit featured images.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-ink text-bg px-5 py-3 rounded-md font-oswald text-xs tracking-wider uppercase hover:bg-camelDeep transition-colors min-h-[44px]"
        >
          + Add Category
        </button>
      </div>

      {/* SHOP THE EDIT CATEGORY PHOTO MANAGER */}
      <div className="bg-panel border border-line rounded-xl p-6 sm:p-8 shadow-sm2 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-line pb-4">
          <div>
            <h2 className="font-oswald text-lg uppercase text-ink">Shop The Edit — Dynamic Category Photography</h2>
            <p className="text-xs text-mute mt-1">
              Upload or assign image URLs for each category. Changes persist dynamically to the database and storefront.
            </p>
          </div>
          <button
            onClick={handleSaveCategoryImages}
            disabled={savingImages}
            className="bg-ink text-bg font-oswald text-xs tracking-wider uppercase px-6 py-3 rounded hover:bg-camelDeep transition-colors disabled:opacity-60 min-h-[44px]"
          >
            {savingImages ? 'Saving to Database...' : 'Save Category Photos'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EDITORIAL_CATEGORIES.map(cat => {
            const currentImg = categoryImages[cat.id] || '';
            return (
              <div key={cat.id} className="bg-bg border border-line rounded-lg p-4 space-y-3 shadow-sm2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <GarmentIcon type={cat.type} mirror={cat.mirror} className="w-5 h-5 text-camelDeep" />
                    <span className="font-oswald text-sm uppercase font-semibold text-ink">{cat.name}</span>
                  </div>
                  <span className="font-mono text-[0.65rem] text-mute uppercase">{cat.id}</span>
                </div>

                {/* Preview Box */}
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

                {/* Controls */}
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={currentImg}
                    onChange={e => handleImageChange(cat.id, e.target.value)}
                    placeholder="Image URL (http...)"
                    className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none focus:border-ink"
                  />

                  <label className="block text-center border border-line bg-panel hover:bg-line text-ink font-oswald text-[0.68rem] tracking-wider uppercase py-2 rounded cursor-pointer transition-colors">
                    Upload Photo File
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(cat.id, e)} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="font-oswald text-xs tracking-wider uppercase text-mute border-b border-line bg-bg">
              <th className="py-3.5 px-4">Category Name</th>
              <th className="py-3.5 px-4">URL Slug</th>
              <th className="py-3.5 px-4">Products</th>
              <th className="py-3.5 px-4">Featured</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => {
              const count = products.filter(
                p => p.category.toLowerCase() === c.slug || p.fit_slug === c.slug
              ).length;
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                  <td className="py-3.5 px-4">
                    <div className="font-oswald uppercase text-ink">{c.name}</div>
                    <div className="text-xs text-mute">{c.description}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-mute">/category/{c.slug}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-oswald text-xs px-2.5 py-1 rounded bg-bg border border-line">{count} pieces</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleFeatured(c.id)}
                      className={`px-3 py-1 rounded font-oswald text-xs uppercase min-h-[44px] ${
                        c.featured ? 'bg-camel/30 text-camelDeep' : 'bg-line text-mute'
                      }`}
                    >
                      {c.featured ? '★ Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="font-oswald text-xs uppercase text-error border-b border-error min-h-[44px]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg border border-line rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-mute hover:text-ink font-oswald text-xs uppercase min-w-[44px] min-h-[44px] flex items-center justify-center">
              ✕
            </button>

            <h3 className="font-oswald text-lg uppercase mb-4">Create Category</h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Category Title *</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Linen Shirts"
                  className="w-full bg-panel border border-line px-3.5 py-3 text-xs text-ink rounded outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description for SEO and header"
                  className="w-full bg-panel border border-line p-3.5 text-xs text-ink rounded outline-none focus:border-ink"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-3.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]">
                  Create Category
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-line font-oswald text-xs uppercase px-6 py-3.5 rounded min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
