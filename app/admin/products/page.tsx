'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { ProductModal } from '@/components/admin/ProductModal';
import { useToast } from '@/components/admin/Toast';

export default function AdminProductsPage() {
  const { products, stockForProduct, loadProducts, loadInventory } = useAdminData();
  const [editing, setEditing] = useState<Product | null | 'new'>(null);
  const showToast = useToast();

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('products').update({ active: !active }).eq('id', id);
    if (error) { showToast('Could not update product'); return; }
    loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Permanently delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast('Could not delete — it may have existing orders. Try deactivating instead.'); return; }
    showToast('Product deleted');
    loadProducts(); loadInventory();
  }

  function exportProductsCSV() {
    if (products.length === 0) return;
    const headers = ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Fabric'];
    const rows = products.map(p => [
      p.id,
      `"${p.name}"`,
      p.category,
      p.price,
      stockForProduct(p.id),
      p.active ? 'Active' : 'Inactive',
      `"${p.fabric || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dvero_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products CSV exported');
  }

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-oswald text-2xl uppercase">Products</h1>
          <p className="text-sm text-mute mt-1">Manage your catalog. Changes sync to the website instantly.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportProductsCSV}
            className="border border-line px-4 py-3 rounded-md font-oswald text-xs tracking-wider uppercase hover:border-ink transition-colors min-h-[44px]"
          >
            Export CSV 📥
          </button>
          <button
            onClick={() => setEditing('new')}
            className="bg-ink text-bg px-5 py-3 rounded-md font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors min-h-[44px]"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-oswald text-xs tracking-wider uppercase text-mute border-b border-line">
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map(p => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                  <td className="py-3 px-4">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} className="w-11 h-14 rounded object-cover border border-line" alt="" />
                    ) : (
                      <div className="w-11 h-14 rounded bg-bg border border-line flex items-center justify-center text-[0.6rem] text-mute">No Img</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.name}
                    {p.fit_type && (
                      <>
                        <br />
                        <span className="text-mute text-xs">{p.fit_type}</span>
                      </>
                    )}
                  </td>
                  <td className="py-3 px-4">{p.category}</td>
                  <td className="py-3 px-4 font-oswald text-camelDeep font-semibold">{formatINR(p.price)}</td>
                  <td className="py-3 px-4 font-mono">{stockForProduct(p.id)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-oswald text-xs uppercase ${p.active ? 'bg-success/15 text-success' : 'bg-error/10 text-error'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setEditing(p)} className="border border-line px-3 py-1.5 rounded-md font-oswald text-xs uppercase">Edit</button>
                      <button onClick={() => toggleActive(p.id, p.active)} className="border border-line px-3 py-1.5 rounded-md font-oswald text-xs uppercase">{p.active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => deleteProduct(p.id)} className="border border-error text-error px-3 py-1.5 rounded-md font-oswald text-xs uppercase hover:bg-error hover:text-white">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-10 text-mute">No products yet — add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { loadProducts(); loadInventory(); }}
        />
      )}
    </div>
  );
}
