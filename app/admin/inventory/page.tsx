'use client';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';

export default function AdminInventoryPage() {
  const { inventory, productNameById, loadInventory } = useAdminData();
  const showToast = useToast();

  const rows = inventory.map(i => ({ ...i, name: productNameById(i.product_id) }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size));

  async function updateStock(id: number, value: string) {
    const stock = Math.max(0, parseInt(value) || 0);
    const { error } = await supabase.from('inventory').update({ stock }).eq('id', id);
    if (error) { showToast('Could not update stock'); return; }
    showToast('Stock updated');
    loadInventory();
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-oswald text-2xl uppercase">Inventory Control</h1>
        <p className="text-sm text-mute mt-1">Update stock per size — changes reflect on the website immediately.</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-oswald text-xs tracking-wider uppercase text-mute border-b border-line">
              <th className="py-3 px-4">Product Garment</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(r => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                <td className="py-3 px-4 font-oswald uppercase text-ink">{r.name}</td>
                <td className="py-3 px-4 font-mono">{r.size}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min={0}
                    defaultValue={r.stock}
                    onBlur={(e) => updateStock(r.id, e.target.value)}
                    className={`w-[80px] border border-line bg-bg rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-ink ${r.stock <= 5 ? 'text-error font-semibold' : ''}`}
                  />
                </td>
              </tr>
            )) : <tr><td colSpan={3} className="text-center py-10 text-mute">No inventory rows yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {rows.length ? rows.map(r => (
          <div key={r.id} className="bg-panel border border-line rounded-lg p-4 shadow-sm2 flex justify-between items-center gap-3">
            <div>
              <div className="font-oswald text-sm uppercase text-ink font-semibold">{r.name}</div>
              <div className="text-xs text-mute font-mono">Size Variant: {r.size}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-oswald uppercase text-mute">Stock:</span>
              <input
                type="number"
                min={0}
                defaultValue={r.stock}
                onBlur={(e) => updateStock(r.id, e.target.value)}
                className={`w-[74px] border border-line bg-bg rounded px-2.5 py-2 text-xs font-mono text-center outline-none focus:border-ink min-h-[44px] ${r.stock <= 5 ? 'text-error font-bold' : ''}`}
              />
            </div>
          </div>
        )) : (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute text-xs font-oswald uppercase">
            No inventory variants configured.
          </div>
        )}
      </div>
    </div>
  );
}
