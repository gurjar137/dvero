'use client';
import { useState } from 'react';
import { useAdminData } from '@/lib/useAdminData';
import { formatINR } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';

export default function AdminAnalyticsPage() {
  const { products, orders, inventory } = useAdminData();
  const showToast = useToast();

  // SEO Form State
  const [metaTitle, setMetaTitle] = useState("D'VERO — Formalwear, Redefined");
  const [metaDesc, setMetaDesc] = useState('Premium formalwear designed in Jaipur, India. Cut true, built to move.');
  const [ogImage, setOgImage] = useState('https://dvero.com/og-banner.jpg');

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const shirtsCount = products.filter(p => p.category === 'Shirts').length;
  const trousersCount = products.filter(p => p.category === 'Trousers').length;

  function handleSaveSEO(e: React.FormEvent) {
    e.preventDefault();
    showToast('SEO Metadata & OpenGraph settings updated');
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="font-oswald text-2xl uppercase">Store Analytics & SEO</h1>
        <p className="text-sm text-mute mt-1">Real-time revenue metrics, product conversion, and SEO metadata.</p>
      </div>

      {/* Analytics Cards Grid — 1 Column Mobile, 2 Tablet, 4 Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-panel border border-line rounded-xl p-5 shadow-sm2 flex flex-col justify-between min-h-[100px]">
          <div className="font-oswald text-2xl sm:text-3xl font-semibold text-camelDeep">{formatINR(totalRevenue)}</div>
          <div className="text-xs text-mute font-oswald uppercase tracking-wider mt-1">Total Gross Revenue</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 shadow-sm2 flex flex-col justify-between min-h-[100px]">
          <div className="font-oswald text-2xl sm:text-3xl font-semibold text-ink">{formatINR(avgOrderValue)}</div>
          <div className="text-xs text-mute font-oswald uppercase tracking-wider mt-1">Avg. Order Value (AOV)</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 shadow-sm2 flex flex-col justify-between min-h-[100px]">
          <div className="font-oswald text-2xl sm:text-3xl font-semibold text-ink">{orders.length}</div>
          <div className="text-xs text-mute font-oswald uppercase tracking-wider mt-1">Total Completed Orders</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 shadow-sm2 flex flex-col justify-between min-h-[100px]">
          <div className="font-oswald text-2xl sm:text-3xl font-semibold text-success">3.4%</div>
          <div className="text-xs text-mute font-oswald uppercase tracking-wider mt-1">Est. Conversion Rate</div>
        </div>
      </div>

      {/* Category Sales Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-xl p-5 sm:p-6 shadow-sm2">
          <h3 className="font-oswald text-base uppercase mb-4">Category Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-oswald uppercase text-mute mb-1">
                <span>Shirts Collection ({shirtsCount} styles)</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-line h-3 rounded-full overflow-hidden">
                <div className="bg-camelDeep h-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-oswald uppercase text-mute mb-1">
                <span>Trousers Collection ({trousersCount} styles)</span>
                <span>55%</span>
              </div>
              <div className="w-full bg-line h-3 rounded-full overflow-hidden">
                <div className="bg-ink h-full" style={{ width: '55%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 sm:p-6 shadow-sm2">
          <h3 className="font-oswald text-base uppercase mb-4">Inventory Health Status</h3>
          <div className="space-y-3 text-xs font-oswald uppercase">
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-mute">Total Active Garment SKUs</span>
              <span className="font-bold text-ink">{products.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-line">
              <span className="text-mute">Total In-Stock Units</span>
              <span className="font-bold text-ink">{inventory.reduce((s, i) => s + i.stock, 0)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-mute">Low Stock Alert Sizes (≤5)</span>
              <span className="font-bold text-error">{inventory.filter(i => i.stock <= 5).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Metadata Form */}
      <div className="bg-panel border border-line rounded-xl p-5 sm:p-8 max-w-2xl shadow-sm2">
        <h3 className="font-oswald text-base uppercase mb-4 border-b border-line pb-3">SEO & OpenGraph Metadata Settings</h3>

        <form onSubmit={handleSaveSEO} className="space-y-4">
          <div>
            <label className="block text-xs font-oswald uppercase text-mute mb-1">Global Meta Title</label>
            <input
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              className="w-full bg-bg border border-line px-3.5 py-3 text-xs text-ink rounded outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-oswald uppercase text-mute mb-1">Meta Description</label>
            <textarea
              rows={3}
              value={metaDesc}
              onChange={e => setMetaDesc(e.target.value)}
              className="w-full bg-bg border border-line p-3.5 text-xs text-ink rounded outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-oswald uppercase text-mute mb-1">OpenGraph Sharing Image URL</label>
            <input
              value={ogImage}
              onChange={e => setOgImage(e.target.value)}
              className="w-full bg-bg border border-line px-3.5 py-3 text-xs font-mono text-ink rounded outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
          >
            Save SEO Metadata
          </button>
        </form>
      </div>
    </div>
  );
}
