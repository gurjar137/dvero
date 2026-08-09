'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
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
  const headerRef = useRef<HTMLElement>(null);

  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const accountContainerRef = useRef<HTMLDivElement>(null);

  // Click/Touch outside & ESC key listener for Account Dropdown & Mobile Drawer
  useEffect(() => {
    function handleOutsidePointer(e: PointerEvent) {
      if (
        accountContainerRef.current &&
        !accountContainerRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setAccountDrawerOpen(false);
      }
    }

    if (accountMenuOpen || accountDrawerOpen) {
      document.addEventListener('pointerdown', handleOutsidePointer);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen, accountDrawerOpen]);

  // Dynamically measure navbar height and set CSS variable --navbar-height
  useEffect(() => {
    if (!headerRef.current) return;

    const updateNavbarHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        if (height > 0) {
          document.documentElement.style.setProperty('--navbar-height', `${height}px`);
        }
      }
    };

    updateNavbarHeight();

    const observer = new ResizeObserver(() => {
      updateNavbarHeight();
    });

    observer.observe(headerRef.current);
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, [pathname]);

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

  // Clean up all header drawers/overlays on route navigation
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountMenuOpen(false);
    setAccountDrawerOpen(false);
  }, [pathname]);

  // Manage body scroll locking for header drawers
  useEffect(() => {
    if (mobileOpen || searchOpen || accountDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, searchOpen, accountDrawerOpen]);

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
    setAccountDrawerOpen(false);
    router.push('/');
  }

  function handleAccountClick() {
    if (session) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setAccountDrawerOpen(true);
      } else {
        setAccountMenuOpen(!accountMenuOpen);
      }
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

  if (pathname?.startsWith('/admin')) return null;

  const isTransparent = pathname === '/' && !isScrolled;

  const userDisplayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Valued Client';

  return (
    <>
      <header
        ref={headerRef}
        className={`transition-all duration-300 ease-in-out ${
          isTransparent
            ? 'absolute top-0 left-0 right-0 z-[1000] bg-transparent text-white border-b border-transparent shadow-none backdrop-blur-none'
            : 'fixed top-0 left-0 right-0 z-[1000] bg-[#FAF9F6] text-[#111111] border-b border-[#EAEAEA] shadow-sm backdrop-blur-md'
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

            {/* Account Icon Wrapper */}
            <div ref={accountContainerRef} className="relative inline-block">
              <button
                onClick={handleAccountClick}
                aria-label="Account Profile"
                className="flex p-1 hover:opacity-60 transition-opacity relative"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-5 h-5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {session && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </button>

              {/* Desktop / Tablet Premium Floating Account Dropdown Card */}
              {session && accountMenuOpen && (
                <div
                  className="hidden md:block absolute right-0 top-[calc(100%+16px)] z-[1100] w-[260px] bg-[#FAF9F6] border border-[#EAEAEA] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-[18px] font-inter text-xs animate-account-dropdown"
                >
                  {/* User Profile Info Header */}
                  <div className="pb-3 border-b border-[#EAEAEA]">
                    <div className="font-oswald text-sm font-semibold uppercase text-[#111111] truncate tracking-wide">
                      {userDisplayName}
                    </div>
                    <div className="font-mono text-[#666666] text-[0.68rem] truncate lowercase mt-0.5">
                      {session.user.email}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="pt-2 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#666666]">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="font-inter text-xs font-medium">My Profile</span>
                    </Link>

                    <Link
                      href="/profile?tab=orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#666666]">
                        <path d="M6 7h12l1 14H5L6 7Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                      </svg>
                      <span className="font-inter text-xs font-medium">My Orders</span>
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#666666]">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span className="font-inter text-xs font-medium">Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="ml-auto bg-[#111111] text-white text-[0.6rem] font-mono rounded-full px-1.5 py-0.5">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/profile?tab=addresses"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#666666]">
                        <path d="M12 21s-7-5.33-7-10a7 7 0 0 1 14 0c0 4.67-7 10-7 10z" />
                        <circle cx="12" cy="11" r="2.5" />
                      </svg>
                      <span className="font-inter text-xs font-medium">Addresses</span>
                    </Link>

                    <Link
                      href="/profile?tab=security"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#666666]">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.75 1.75 0 0 0 .34 1.87M4.6 9a1.75 1.75 0 0 0-.34-1.87M9 4.6a1.75 1.75 0 0 0 1-1.55M15 19.4a1.75 1.75 0 0 0-1-1.55" />
                      </svg>
                      <span className="font-inter text-xs font-medium">Settings</span>
                    </Link>

                    <div className="pt-2 border-t border-[#EAEAEA] mt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2]/60 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[#DC2626]">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span className="font-inter text-xs font-semibold">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(false);
                setAccountMenuOpen(false);
                setAccountDrawerOpen(false);
                setCartDrawerOpen(true);
              }}
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
          </div>
        </nav>
      </header>

      {/* Mobile Account Drawer (Slide-Over from Right for Mobile) */}
      {session && accountDrawerOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAccountDrawerOpen(false);
          }}
          className="md:hidden fixed inset-0 z-[1200] bg-[#111111]/80 backdrop-blur-md flex justify-end animate-fadeIn"
        >
          <div className="w-4/5 max-w-xs bg-[#FAF9F6] h-full p-6 flex flex-col justify-between border-l border-[#EAEAEA] shadow-2xl overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-[#EAEAEA] mb-6">
                <div>
                  <span className="font-playfair text-lg tracking-[0.2em] text-[#111111] uppercase block">
                    Account
                  </span>
                  <span className="font-mono text-[#666666] text-[0.65rem] lowercase block truncate max-w-[180px]">
                    {session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => setAccountDrawerOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center font-inter text-sm uppercase text-[#666666] hover:text-[#111111]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setAccountDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors border-b border-[#EAEAEA]/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#666666]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="font-inter text-xs tracking-wider uppercase font-medium">My Profile</span>
                </Link>

                <Link
                  href="/profile?tab=orders"
                  onClick={() => setAccountDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors border-b border-[#EAEAEA]/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#666666]">
                    <path d="M6 7h12l1 14H5L6 7Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                  </svg>
                  <span className="font-inter text-xs tracking-wider uppercase font-medium">My Orders</span>
                </Link>

                <Link
                  href="/wishlist"
                  onClick={() => setAccountDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors border-b border-[#EAEAEA]/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#666666]">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="font-inter text-xs tracking-wider uppercase font-medium">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-auto bg-[#111111] text-white text-[0.6rem] font-mono rounded-full px-2 py-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile?tab=addresses"
                  onClick={() => setAccountDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors border-b border-[#EAEAEA]/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#666666]">
                    <path d="M12 21s-7-5.33-7-10a7 7 0 0 1 14 0c0 4.67-7 10-7 10z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                  <span className="font-inter text-xs tracking-wider uppercase font-medium">Addresses</span>
                </Link>

                <Link
                  href="/profile?tab=security"
                  onClick={() => setAccountDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#111111] hover:bg-[#ECEAE4] transition-colors border-b border-[#EAEAEA]/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[#666666]">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.75 1.75 0 0 0 .34 1.87M4.6 9a1.75 1.75 0 0 0-.34-1.87M9 4.6a1.75 1.75 0 0 0 1-1.55M15 19.4a1.75 1.75 0 0 0-1-1.55" />
                  </svg>
                  <span className="font-inter text-xs tracking-wider uppercase font-medium">Settings</span>
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-[#EAEAEA] mt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-[#DC2626] text-white py-3 rounded-lg font-inter text-xs uppercase tracking-wider font-semibold shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
