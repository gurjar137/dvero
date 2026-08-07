'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { useWishlist } from './WishlistContext';
import { useProducts } from '@/lib/useProducts';
import { useSettings } from '@/lib/useSettings';
import { supabase } from '@/lib/supabase/client';
import { formatINR } from '@/lib/utils';
import { ProductVisual } from './GarmentIcon';
import { CartDrawer } from './CartDrawer';
import { AuthModal } from './AuthModal';
import { Toast } from './Toast';
import type { AuthSuccessResult } from './AuthFormCore';

export function Header() {
  const { cartCount, setCartDrawerOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { session } = useAuth();
  const { settings } = useSettings();
  const { products } = useProducts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authToast, setAuthToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Scroll listener for sticky transparent-to-solid transition
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const navLinks = [
    { href: '/', label: 'Shop' },
    { href: '/category/shirts', label: 'Shirts' },
    { href: '/category/trousers', label: 'Trousers' },
    { href: '/about', label: 'About' },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    setAccountMenuOpen(false);
    router.push('/');
  }

  function handleAccountClick() {
    if (session) {
      setAccountMenuOpen(!accountMenuOpen);
    } else {
      setAuthModalOpen(true);
    }
  }

  const searchResults = debouncedQuery
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(debouncedQuery) ||
          p.category.toLowerCase().includes(debouncedQuery) ||
          (p.fabric && p.fabric.toLowerCase().includes(debouncedQuery)) ||
          (p.description && p.description.toLowerCase().includes(debouncedQuery)) ||
          (p.fit_type && p.fit_type.toLowerCase().includes(debouncedQuery))
      )
    : [];

  const isTransparent = pathname === '/' && !isScrolled;

  return (
    <>
      <header
        className={`transition-all duration-300 ease-in-out ${
          isTransparent
            ? 'absolute top-0 left-0 right-0 z-40 bg-transparent text-white border-b border-transparent shadow-none backdrop-blur-none'
            : 'fixed top-0 left-0 right-0 z-40 bg-[#FAF9F6] text-[#111111] border-b border-[#EAEAEA] shadow-sm backdrop-blur-md'
        }`}
      >
        <nav className="flex items-center justify-between px-4 sm:px-8 md:px-14 py-4 max-w-[1440px] mx-auto min-h-[64px] w-full">
          
          {/* LEFT: Menu Links (Desktop) / Hamburger (Mobile) */}
          <div className="flex items-center justify-start gap-6 w-1/3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open Mobile Menu"
              className="md:hidden p-1 hover:opacity-60 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
              </svg>
            </button>

            <ul className="hidden md:flex items-center gap-8">
              {navLinks.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`font-inter text-xs tracking-[0.15em] uppercase hover:opacity-60 transition-opacity ${
                      pathname === l.href
                        ? 'font-medium'
                        : isTransparent
                        ? 'text-white/80'
                        : 'text-[#666666]'
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CENTER LOGO */}
          <div className="flex justify-center items-center w-1/3">
            <Link
              href="/"
              className={`font-playfair text-xl sm:text-2xl tracking-[0.3em] uppercase hover:opacity-75 transition-opacity select-none ${
                isTransparent ? 'text-white' : 'text-[#111111]'
              }`}
            >
              D'VERO
            </Link>
          </div>

          {/* RIGHT ICONS: Search, Account, Wishlist, Cart */}
          <div className="flex items-center justify-end gap-4 sm:gap-6 w-1/3 relative">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-1 hover:opacity-60 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={handleAccountClick}
              aria-label="Account Profile"
              className="hidden md:flex p-1 hover:opacity-60 transition-opacity relative"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {session && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </button>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden md:flex relative p-1 hover:opacity-60 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className={`absolute -top-1 -right-1 text-[0.55rem] rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono ${
                  isTransparent ? 'bg-white text-[#111111]' : 'bg-[#111111] text-[#FAF9F6]'
                }`}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Open cart drawer"
              className="relative p-1 hover:opacity-60 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                <path d="M6 7h12l1 14H5L6 7Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
              </svg>
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 text-[0.55rem] rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono ${
                  isTransparent ? 'bg-white text-[#111111]' : 'bg-[#111111] text-[#FAF9F6]'
                }`}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Logged-In Luxury Account Popover Dropdown */}
            {session && accountMenuOpen && (
              <div
                className="absolute right-0 top-10 z-50 w-56 bg-[#FAF9F6] border border-[#EAEAEA] rounded-md shadow-lg p-3 animate-fadeIn space-y-1 font-inter text-xs tracking-wider"
                onMouseLeave={() => setAccountMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#EAEAEA] mb-1">
                  <div className="text-[0.65rem] text-[#666666] uppercase">Signed in as</div>
                  <div className="font-mono text-[#111111] text-[0.7rem] truncate lowercase">{session.user.email}</div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setAccountMenuOpen(false)}
                  className="block px-3 py-2 rounded hover:bg-[#ECEAE4] transition-colors"
                >
                  My Profile & Orders
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setAccountMenuOpen(false)}
                  className="block px-3 py-2 rounded hover:bg-[#ECEAE4] transition-colors"
                >
                  Wishlist ({wishlistCount})
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#ECEAE4] text-[#111111] transition-colors border-t border-[#EAEAEA] mt-1"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Logged-Out Auth Modal / Bottom Sheet */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Welcome to D'VERO"
        subtitle="Sign in or create your account to view your orders, saved addresses, and wishlist."
        onAuthSuccess={(result: AuthSuccessResult) => {
          if (result.mode === 'signup') setAuthToast('Welcome to DVERO.');
        }}
      />

      {authToast && <Toast message={authToast} type="success" onClose={() => setAuthToast(null)} />}

      {/* Luxury Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-md flex animate-fadeIn">
          <div className="w-4/5 max-w-sm bg-[#FAF9F6] h-full p-6 flex flex-col justify-between border-r border-[#EAEAEA] shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-[#EAEAEA] mb-6">
                <span className="font-playfair text-xl tracking-[0.25em] text-[#111111] uppercase">D'VERO</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center font-inter text-sm uppercase text-[#666666] hover:text-[#111111]"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col space-y-3">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  Shop
                </Link>
                <Link
                  href="/category/shirts"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  Shirts
                </Link>
                <Link
                  href="/category/trousers"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  Trousers
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  About
                </Link>
                <Link
                  href="#featured-collection"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  New Arrivals
                </Link>
                <Link
                  href={session ? "/profile" : "#"}
                  onClick={() => {
                    setMobileOpen(false);
                    if (!session) setAuthModalOpen(true);
                  }}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  {session ? "My Account" : "Login / Sign Up"}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity flex justify-between items-center"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-[#111111] text-[#FAF9F6] text-xs px-2 py-0.5 rounded-full font-mono">{wishlistCount}</span>
                  )}
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="font-inter text-sm tracking-[0.15em] uppercase py-2.5 border-b border-[#EAEAEA]/60 text-[#111111] hover:opacity-60 transition-opacity"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-line space-y-3">
              {session ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center bg-ink text-bg font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm min-h-[44px]"
                  >
                    My Account & Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center font-oswald text-xs tracking-wider uppercase text-mute py-2 min-h-[44px]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="text-center border border-line py-3 rounded-sm font-oswald text-xs tracking-wider uppercase min-h-[44px]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="text-center bg-ink text-bg py-3 rounded-sm font-oswald text-xs tracking-wider uppercase min-h-[44px]"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Debounced Search Drawer / Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-md flex flex-col items-center pt-12 sm:pt-16 px-4 animate-fadeIn">
          <div className="max-w-2xl w-full bg-bg border border-line rounded-lg shadow-2xl p-4 sm:p-6 relative">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-4 right-4 text-mute hover:text-ink font-oswald text-xs uppercase tracking-wider min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="font-oswald text-lg uppercase mb-3">Search Collection</h3>
            <div className="relative mb-6">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by garment, fit, fabric or keyword..."
                className="w-full bg-panel border border-line p-3.5 sm:p-4 rounded-sm font-oswald text-xs sm:text-sm tracking-wider uppercase text-ink outline-none focus:border-ink"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mute hover:text-ink text-xs font-oswald uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {!debouncedQuery ? (
                <div className="text-center py-8 text-mute text-xs font-oswald uppercase tracking-wider">
                  Type to search across all formalwear
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-mute text-xs font-oswald uppercase tracking-wider">
                  No pieces found matching &ldquo;{debouncedQuery}&rdquo;
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {searchResults.map(product => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex gap-4 p-3 rounded-md bg-panel border border-line hover:border-ink transition-all group"
                    >
                      <div className="w-14 h-18 bg-bg border border-line rounded flex items-center justify-center flex-shrink-0">
                        <ProductVisual image={product.images?.[0]} type={product.type} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-oswald text-xs uppercase tracking-wider group-hover:text-camelDeep transition-colors">
                          {product.name}
                        </span>
                        <span className="text-[0.7rem] text-mute">{product.fabric}</span>
                        <span className="font-oswald text-xs text-camelDeep mt-1">{formatINR(product.price)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />
    </>
  );
}
