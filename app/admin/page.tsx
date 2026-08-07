'use client';
import Link from 'next/link';
import { useAdminData } from '@/lib/useAdminData';
import { formatINR } from '@/lib/utils';

export default function AdminDashboard() {
  const { products, orders, inventory, profiles } = useAdminData();
  const activeProducts = products.filter(p => p.active).length;
  const lowStockCount = inventory.filter(i => i.stock <= 5).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter(o => o.created_at?.slice(0, 10) === todayStr).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const uniqueCustomers = new Set(orders.map(o => o.email).filter(Boolean)).size || (profiles ? profiles.length : 0);
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-oswald text-2xl uppercase tracking-wider text-ink font-bold">Dashboard</h1>
          <p className="text-xs text-mute mt-1 font-inter">
            Live overview of orders, revenue, inventory, and storefront activity.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            href="/admin/products"
            className="w-full sm:w-auto text-center bg-ink text-bg px-5 py-2.5 rounded-lg font-oswald text-xs uppercase tracking-widest hover:bg-camelDeep transition-all duration-200 shadow-sm min-h-[44px] flex items-center justify-center font-medium"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* 5 Required Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          value={orders.length}
          label="Orders"
          subtext={`${ordersToday} placed today`}
          icon="bag"
        />
        <StatCard
          value={formatINR(totalRevenue)}
          label="Revenue"
          subtext="Total store revenue"
          highlight
          icon="currency"
        />
        <StatCard
          value={products.length}
          label="Products"
          subtext={`${activeProducts} active listed`}
          icon="box"
        />
        <StatCard
          value={uniqueCustomers}
          label="Customers"
          subtext="Registered & guests"
          icon="users"
        />
        <StatCard
          value={lowStockCount}
          label="Low Stock"
          subtext="Items with ≤ 5 units"
          warn={lowStockCount > 0}
          icon="alert"
        />
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-4">
          <div>
            <h2 className="font-oswald text-base uppercase font-semibold text-ink tracking-wide">Recent Orders</h2>
            <p className="text-xs text-mute font-inter">Latest order transactions placed on D&apos;VERO</p>
          </div>
          <Link
            href="/admin/orders"
            className="font-oswald text-xs uppercase tracking-wider text-camelDeep hover:underline flex items-center gap-1 font-medium"
          >
            View All Orders &rarr;
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="font-oswald text-[0.68rem] tracking-widest uppercase text-mute border-b border-line bg-bg/50">
                <th className="py-3 px-4 rounded-l-lg">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {recentOrders.length ? (
                recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-bg/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-ink">#{o.order_number}</td>
                    <td className="py-3.5 px-4 font-medium text-ink">{o.customer_name}</td>
                    <td className="py-3.5 px-4 font-oswald text-camelDeep font-semibold text-sm">
                      {formatINR(o.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-bg border border-line px-2.5 py-1 rounded-full font-oswald text-[0.62rem] uppercase tracking-wider font-semibold text-ink inline-block">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-mute font-mono">
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-mute font-oswald uppercase text-xs">
                    No recent orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden space-y-3">
          {recentOrders.length ? (
            recentOrders.map(o => (
              <div key={o.id} className="bg-bg border border-line rounded-lg p-4 space-y-2 shadow-xs">
                <div className="flex justify-between items-center text-xs font-oswald uppercase">
                  <span className="font-mono font-bold text-ink text-sm">#{o.order_number}</span>
                  <span className="bg-panel border border-line px-2.5 py-0.5 rounded-full text-[0.6rem] font-semibold text-ink">
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs font-medium text-ink">{o.customer_name}</div>
                <div className="flex justify-between items-center text-xs font-oswald uppercase pt-2 border-t border-line/60">
                  <span className="text-mute font-mono text-[0.68rem]">
                    {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </span>
                  <span className="text-camelDeep font-bold text-sm">{formatINR(o.total)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-mute text-xs font-oswald uppercase">No recent orders.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  subtext,
  warn,
  highlight,
  icon,
}: {
  value: string | number;
  label: string;
  subtext: string;
  warn?: boolean;
  highlight?: boolean;
  icon: string;
}) {
  return (
    <div className="bg-panel border border-line rounded-xl shadow-sm2 p-4 sm:p-5 flex flex-col justify-between hover:border-ink/30 transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-mute font-oswald uppercase tracking-wider font-semibold">{label}</span>
        <span className="w-7 h-7 rounded-lg bg-bg border border-line flex items-center justify-center text-mute shrink-0">
          {icon === 'bag' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path d="M6 8h12l1 13H5L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          )}
          {icon === 'currency' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          )}
          {icon === 'box' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
              <path d="M3 8v8l9 5 9-5V8" />
            </svg>
          )}
          {icon === 'users' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c1.2-3.6 3.8-5.5 6.5-5.5s5.3 1.9 6.5 5.5" />
            </svg>
          )}
          {icon === 'alert' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </span>
      </div>

      <div
        className={`font-oswald text-2xl sm:text-3xl font-bold tracking-tight ${
          warn ? 'text-error' : highlight ? 'text-camelDeep' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="text-[0.68rem] text-mute font-inter mt-1 truncate">{subtext}</div>
    </div>
  );
}
