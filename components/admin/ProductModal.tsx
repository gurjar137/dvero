'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types';
import { useToast } from './Toast';

const EMPTY: Partial<Product> = {
  id: '', name: '', category: 'Shirts', fit_type: '', fit_slug: '', price: undefined,
  fabric: '', cut: '', fit: '', sizes: [], description: '', care: '', badge: '', images: [], active: true
};

export function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !product;
  const [form, setForm] = useState<Partial<Product>>(product ? { ...product } : { ...EMPTY });
  const [images, setImages] = useState<string[]>(product?.images ? [...product.images] : []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split('.').pop();
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
        setImages(prev => [...prev, pub.publicUrl]);
      } catch (err: any) {
        showToast('Image upload failed: ' + (err.message || ''));
      }
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get('id') || '').trim();
    const category = String(fd.get('category'));
    const sizesArr = String(fd.get('sizes') || '').split(',').map(s => s.trim()).filter(Boolean);
    const fitType = String(fd.get('fit_type') || '');

    const payload = {
      id, name: fd.get('name'), category,
      fit_type: fitType || null,
      fit_slug: String(fd.get('fit_slug') || '') || (fitType ? fitType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null),
      price: Number(fd.get('price')), fabric: fd.get('fabric'), cut: fd.get('cut'), fit: fd.get('fit'),
      sizes: sizesArr, description: fd.get('description'), care: fd.get('care'),
      badge: fd.get('badge') || null, images, active: fd.get('active') === 'on'
    };

    try {
      const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      const { data: existingInv } = await supabase.from('inventory').select('size').eq('product_id', id);
      const existingSizes = (existingInv || []).map((r: any) => r.size);
      const newSizes = sizesArr.filter(s => !existingSizes.includes(s));
      if (newSizes.length) {
        await supabase.from('inventory').upsert(newSizes.map(s => ({ product_id: id, size: s, stock: 0 })), { onConflict: 'product_id,size' });
      }

      showToast(isNew ? 'Product created' : 'Product updated');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast('Could not save product: ' + (err.message || ''));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-ink/55 flex items-center justify-center z-[200] p-5" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bg rounded-xl max-w-[640px] w-full max-h-[90vh] overflow-y-auto shadow-lg2">
        <div className="flex justify-between items-center px-7 py-5 border-b border-line sticky top-0 bg-bg z-10">
          <h3 className="font-oswald text-lg uppercase">{isNew ? 'Add Product' : 'Edit Product'}</h3>
          <button onClick={onClose} className="text-2xl text-mute leading-none">×</button>
        </div>
        <form onSubmit={handleSave} className="p-7">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product ID" span={1}><input required name="id" defaultValue={form.id} readOnly={!isNew} className={`w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep ${!isNew ? 'opacity-60' : ''}`} placeholder="e.g. D-07" /></Field>
            <Field label="Category"><select name="category" defaultValue={form.category} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep"><option value="Shirts">Shirts</option><option value="Trousers">Trousers</option></select></Field>
            <Field label="Name" span={2}><input required name="name" defaultValue={form.name} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Fit Type (trousers)"><input name="fit_type" defaultValue={form.fit_type || ''} placeholder="e.g. Boot Cut" className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Fit Slug (auto if blank)"><input name="fit_slug" defaultValue={form.fit_slug || ''} placeholder="e.g. boot-cut" className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Price (₹)"><input required type="number" name="price" defaultValue={form.price as any} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Badge"><input name="badge" defaultValue={form.badge || ''} placeholder="e.g. New (optional)" className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Fabric"><input name="fabric" defaultValue={form.fabric || ''} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Cut"><input name="cut" defaultValue={form.cut || ''} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Fit Notes" span={2}><input name="fit" defaultValue={form.fit || ''} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Sizes (comma-separated)" span={2}><input required name="sizes" defaultValue={(form.sizes || []).join(', ')} placeholder="S, M, L, XL, XXL" className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Description" span={2}><textarea name="description" rows={3} defaultValue={form.description || ''} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <Field label="Care Instructions" span={2}><textarea name="care" rows={2} defaultValue={form.care || ''} className="w-full border border-line bg-bg rounded-md px-3 py-2.5 outline-none focus:border-camelDeep" /></Field>
            <div className="col-span-2">
              <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Product Images</label>
              <div className="flex gap-3 flex-wrap mb-2">
                {images.map((url, i) => (
                  <div key={i} className="relative w-[74px] h-[94px] rounded-md overflow-hidden border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-ink/75 text-white w-[18px] h-[18px] rounded-full text-xs leading-none">×</button>
                  </div>
                ))}
                {images.length === 0 && <span className="text-sm text-mute">No images yet</span>}
              </div>
              <label htmlFor="imgUpload" className="block border-2 border-dashed border-line rounded-lg p-5 text-center text-sm text-mute cursor-pointer hover:border-camelDeep hover:text-ink transition-colors">
                Click to upload image(s) to the product-images bucket
              </label>
              <input id="imgUpload" type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
              {uploading && <div className="text-xs text-mute mt-2">Uploading…</div>}
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" name="active" id="activeCheck" defaultChecked={form.active !== false} className="w-auto" />
              <label htmlFor="activeCheck" className="text-sm">Visible on website</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button disabled={saving} type="submit" className="bg-ink text-bg px-6 py-3 rounded-md font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors disabled:opacity-60">{saving ? 'Saving…' : 'Save Product'}</button>
            <button type="button" onClick={onClose} className="border border-line px-6 py-3 rounded-md font-oswald text-sm tracking-wider uppercase">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return <div className={span === 2 ? 'col-span-2' : ''}><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">{label}</label>{children}</div>;
}
