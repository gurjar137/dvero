'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAdminAuth } from './AdminAuthContext';

const ICONS: Record<string, JSX.Element> = {
  dash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="12" width="8" height="9" rx="1.5" />
      <rect x="3" y="14" width="8" height="7" rx="1.5" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1.2-3.6 3.8-5.5 6.5-5.5s5.3 1.9 6.5 5.5" />
      <circle cx="17" cy="8" r="2.6" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87M4.6 9a1.7 1.7 0 0 0-.34-1.87M9 4.6a1.7 1.7 0 0 0 1-1.55M15 19.4a1.7 1.7 0 0 0-1-1.55" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'dash' },
  { href: '/admin/products', label: 'Products', icon: 'box' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'layers' },
  { href: '/admin/categories', label: 'Categories', icon: 'grid' },
  { href: '/admin/orders', label: 'Orders', icon: 'bag' },
  { href: '/admin/users', label: 'Customers', icon: 'users' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'star' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'tag' },
  { href: '/admin/media', label: 'Homepage Manager', icon: 'image' },
  { href: '/admin/analytics', label: 'Analytics & SEO', icon: 'chart' },
  { href: '/admin/settings', label: 'Settings', icon: 'gear' },
  { href: '/admin/profile', label: 'My Profile', icon: 'user' },
];

function initials(name?: string | null) {
  return String(name || 'A')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  if (!admin) return null;

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-ink text-bg px-4 py-3 border-b border-white/10 flex justify-between items-center sticky top-0 z-40">
        <div className="font-cinzel text-lg tracking-[0.14em]">
          D&apos;VERO <span className="text-camel font-oswald text-xs uppercase">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
          className="p-2 border border-white/20 rounded font-oswald text-xs uppercase tracking-wider text-bg flex items-center gap-1.5"
        >
          <span>Menu</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col justify-between p-6 animate-fadeIn">
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <span className="font-cinzel text-xl text-bg tracking-widest">D&apos;VERO ADMIN</span>
              <button onClick={() => setMobileOpen(false)} className="text-bg font-oswald text-sm uppercase p-2">
                Close ✕
              </button>
            </div>

            <nav className="grid grid-cols-2 gap-2">
              {NAV.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-md font-oswald text-xs tracking-wider uppercase transition-colors ${
                      active ? 'bg-camelDeep text-white font-semibold' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {ICONS[item.icon]}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-white/70">
                Logged in as <strong className="text-bg">{admin.full_name || admin.email}</strong> ({admin.role})
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full bg-error text-bg py-3 rounded-md font-oswald text-xs tracking-widest uppercase"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex bg-ink text-bg flex-col p-6 h-screen sticky top-0 w-[250px] overflow-y-auto border-r border-white/10 flex-shrink-0">
        <div className="font-cinzel text-xl tracking-[0.14em] pb-6 border-b border-white/10 mb-5">
          D&apos;VERO
          <span className="block font-oswald text-[0.6rem] tracking-[0.18em] text-camel mt-1">Admin Panel</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-oswald text-xs tracking-wider uppercase transition-colors ${
                  active ? 'bg-camelDeep text-white font-semibold shadow-sm2' : 'text-white/70 hover:bg-white/5 hover:text-bg'
                }`}
              >
                {ICONS[item.icon]}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-1 mb-3">
            <div className="w-9 h-9 rounded-full bg-camel text-ink flex items-center justify-center font-oswald text-xs font-semibold">
              {initials(admin.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate text-bg">{admin.full_name || admin.email}</div>
              <div className="text-[0.65rem] text-white/50 capitalize font-mono">{admin.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full border border-white/20 text-bg py-2 rounded-md font-oswald text-xs tracking-wider uppercase hover:bg-white/10 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
