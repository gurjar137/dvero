'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Coupon } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minSpend, setMinSpend] = useState(2000);
  const [active, setActive] = useState(true);

  const showToast = useToast();

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  function handleOpenCreate() {
    setEditing(null);
    setCode('');
    setDiscountType('percent');
    setDiscountValue(10);
    setMinSpend(2000);
    setActive(true);
    setShowModal(true);
  }

  function handleOpenEdit(c: Coupon) {
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinSpend(c.min_spend);
    setActive(c.active);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a valid coupon code');
      return;
    }

    const val = Number(discountValue);
    const minS = Number(minSpend);

    if (isNaN(val) || val <= 0) {
      showToast('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'percent' && val > 100) {
      showToast('Percentage discount cannot exceed 100%');
      return;
    }

    if (isNaN(minS) || minS < 0) {
      showToast('Minimum order spend cannot be negative');
      return;
    }

    const payload = {
      code: cleanCode,
      discount_type: discountType,
      discount_value: val,
      min_spend: minS,
      active,
    };

    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (!error) {
        showToast('Coupon updated');
        setShowModal(false);
        fetchCoupons();
      } else {
        showToast(error.message);
      }
    } else {
      const { error } = await supabase.from('coupons').insert([payload]);
      if (!error) {
        showToast('Coupon created');
        setShowModal(false);
        fetchCoupons();
      } else {
        showToast(error.message);
      }
    }
  }

  async function toggleActive(c: Coupon) {
    const { error } = await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id);
    if (!error) {
      showToast(`Coupon ${c.code} ${!c.active ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this coupon code permanently?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) {
      showToast('Coupon deleted');
      fetchCoupons();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-oswald text-2xl uppercase">Coupons & Promo System</h1>
          <p className="text-sm text-mute mt-1">Create promotional discount codes for checkout validation.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-ink text-bg px-5 py-3 rounded-md font-oswald text-xs tracking-wider uppercase hover:bg-camelDeep transition-colors min-h-[44px]"
        >
          + Create Coupon
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="font-oswald text-xs tracking-wider uppercase text-mute border-b border-line bg-bg">
              <th className="py-3.5 px-4">Coupon Code</th>
              <th className="py-3.5 px-4">Discount</th>
              <th className="py-3.5 px-4">Min. Spend</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-mute font-oswald text-xs uppercase">
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-mute">
                  No coupons found — click &ldquo;+ Create Coupon&rdquo; to add your first promotion.
                </td>
              </tr>
            ) : (
              coupons.map(c => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-ink uppercase">{c.code}</td>
                  <td className="py-3.5 px-4 font-oswald text-camelDeep font-semibold">
                    {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `-${formatINR(c.discount_value)}`}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono">{formatINR(c.min_spend)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded font-oswald text-xs uppercase ${c.active ? 'bg-success/15 text-success' : 'bg-error/10 text-error'}`}>
                      {c.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleOpenEdit(c)} className="border border-line px-3 py-1.5 rounded font-oswald text-xs uppercase min-h-[44px]">
                        Edit
                      </button>
                      <button onClick={() => toggleActive(c)} className="border border-line px-3 py-1.5 rounded font-oswald text-xs uppercase min-h-[44px]">
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="border border-error text-error px-3 py-1.5 rounded font-oswald text-xs uppercase min-h-[44px]">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute font-oswald text-xs uppercase">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute font-oswald text-xs uppercase">No coupons found.</div>
        ) : (
          coupons.map(c => (
            <div key={c.id} className="bg-panel border border-line rounded-lg p-4 shadow-sm2 space-y-3">
              <div className="flex justify-between items-center border-b border-line pb-2">
                <span className="font-mono font-bold text-base text-ink uppercase">{c.code}</span>
                <span className={`px-2.5 py-0.5 rounded font-oswald text-[0.65rem] uppercase ${c.active ? 'bg-success/15 text-success' : 'bg-error/10 text-error'}`}>
                  {c.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-oswald uppercase">
                <span>Discount: <strong className="text-camelDeep">{c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `-${formatINR(c.discount_value)}`}</strong></span>
                <span>Min: <span className="font-mono">{formatINR(c.min_spend)}</span></span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-line">
                <button onClick={() => handleOpenEdit(c)} className="flex-1 border border-line py-2.5 rounded font-oswald text-xs uppercase min-h-[44px]">Edit</button>
                <button onClick={() => toggleActive(c)} className="flex-1 border border-line py-2.5 rounded font-oswald text-xs uppercase min-h-[44px]">{c.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleDelete(c.id)} className="border border-error text-error px-3 py-2.5 rounded font-oswald text-xs uppercase min-h-[44px]">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg border border-line rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-mute font-oswald text-xs uppercase min-w-[44px] min-h-[44px] flex items-center justify-center">
              ✕
            </button>

            <h3 className="font-oswald text-lg uppercase mb-4">{editing ? 'Edit Coupon' : 'Create New Coupon'}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Coupon Code (Uppercase) *</label>
                <input
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DVERO10"
                  className="w-full bg-panel border border-line px-3.5 py-3 text-xs font-mono font-bold uppercase text-ink rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-oswald uppercase text-mute mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full bg-panel border border-line px-3.5 py-3 text-xs font-oswald uppercase text-ink rounded outline-none min-h-[44px]"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-oswald uppercase text-mute mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-panel border border-line px-3.5 py-3 text-xs font-mono text-ink rounded outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Minimum Order Spend (₹)</label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={e => setMinSpend(Number(e.target.value))}
                  className="w-full bg-panel border border-line px-3.5 py-3 text-xs font-mono text-ink rounded outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-oswald uppercase cursor-pointer">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-ink" />
                Coupon Active & Ready for Checkout
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-3.5 rounded hover:bg-camelDeep min-h-[44px]">
                  {editing ? 'Save Coupon' : 'Create Coupon'}
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
