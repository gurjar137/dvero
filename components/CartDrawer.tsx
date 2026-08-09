'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useProducts } from '@/lib/useProducts';
import { useSettings } from '@/lib/useSettings';
import { useAuth } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ProductVisual } from './GarmentIcon';
import { formatINR } from '@/lib/utils';

export function CartDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateQty,
    moveToSaveForLater,
    appliedCoupon,
    removeCoupon,
    calcDiscount,
  } = useCart();
  const { findProduct } = useProducts();
  const { settings, shippingFor } = useSettings();

  // 1. Manage Body Scroll Lock with reliable cleanup
  useEffect(() => {
    if (cartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartDrawerOpen]);

  // 2. Automatically close drawer on route navigation
  useEffect(() => {
    setCartDrawerOpen(false);
  }, [pathname, setCartDrawerOpen]);

  // 3. Close drawer on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCartDrawerOpen(false);
      }
    }
    if (cartDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartDrawerOpen, setCartDrawerOpen]);

  function handleCheckoutClick() {
    setCartDrawerOpen(false);
    if (session?.user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=%2Fcheckout');
    }
  }

  if (!cartDrawerOpen) return null;

  const validItems = cart.filter(c => Boolean(findProduct(c.id)));

  const subtotal = validItems.reduce((s, c) => {
    const p = findProduct(c.id);
    return s + (p ? p.price * c.qty : 0);
  }, 0);

  const discount = calcDiscount(subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = shippingFor(discountedSubtotal);
  const total = discountedSubtotal + shipping;

  const freeShippingThreshold = settings.free_shipping_threshold || 4999;
  const awayFromFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden bg-ink/70 backdrop-blur-sm animate-fadeIn">
      <div
        onClick={() => setCartDrawerOpen(false)}
        className="absolute inset-0 cursor-pointer"
        aria-label="Close cart drawer"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 w-full sm:w-[450px]">
        <div className="w-full bg-bg border-l border-line shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-line flex justify-between items-center bg-panel">
            <div>
              <h2 className="font-oswald text-xl uppercase">Shopping Bag</h2>
              <p className="text-xs text-mute font-oswald uppercase tracking-wider">
                {validItems.length} item{validItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink hover:text-camelDeep font-oswald text-sm uppercase tracking-wider"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-bg border-b border-line p-3 sm:p-4 text-center">
            <p className="text-xs font-oswald uppercase tracking-wider text-success mb-1.5 font-semibold">
              ✓ Free Standard & Express Shipping On All Orders
            </p>
            <div className="w-full bg-line h-1.5 rounded-full overflow-hidden">
              <div className="bg-camelDeep h-full transition-all duration-300 w-full" />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {validItems.length === 0 ? (
              <div className="text-center py-16">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-12 h-12 text-mute mx-auto mb-3"
                >
                  <path d="M6 8h12l1 13H5L6 8Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
                <p className="font-oswald text-lg uppercase mb-2">Your Bag Is Empty</p>
                <p className="text-mute text-xs mb-6">Explore our formalwear collection and find your fit.</p>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-6 py-3 rounded-sm hover:bg-camelDeep transition-colors"
                >
                  Explore Shop
                </button>
              </div>
            ) : (
              validItems.map((item, index) => {
                const p = findProduct(item.id);
                if (!p) return null;
                return (
                  <div key={index} className="flex gap-3 pb-4 border-b border-line items-center">
                    <div className="w-16 h-20 bg-panel border border-line rounded flex items-center justify-center flex-shrink-0">
                      <ProductVisual image={p.images?.[0]} type={p.type} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-oswald text-xs uppercase truncate mb-0.5">{p.name}</h4>
                      <p className="text-[0.72rem] text-mute mb-2">Size: {item.size}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-line rounded-sm bg-panel">
                          <button
                            onClick={() => updateQty(index, item.qty - 1)}
                            className="min-w-[32px] min-h-[32px] font-oswald text-xs"
                          >
                            −
                          </button>
                          <span className="min-w-[24px] text-center font-oswald text-xs">{item.qty}</span>
                          <button
                            onClick={() => updateQty(index, item.qty + 1)}
                            className="min-w-[32px] min-h-[32px] font-oswald text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-oswald text-xs text-camelDeep font-medium">
                          {formatINR(p.price * item.qty)}
                        </span>
                      </div>

                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => moveToSaveForLater(index)}
                          className="text-[0.65rem] font-oswald uppercase text-mute hover:text-ink"
                        >
                          Save For Later
                        </button>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-[0.65rem] font-oswald uppercase text-mute hover:text-error"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {validItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-line bg-panel space-y-3">
              {appliedCoupon && (
                <div className="flex justify-between items-center text-xs font-oswald uppercase text-success bg-bg p-2 rounded border border-line">
                  <span>Code: {appliedCoupon.code} applied (-{formatINR(discount)})</span>
                  <button onClick={removeCoupon} className="text-error ml-2">Remove ×</button>
                </div>
              )}

              <div className="space-y-1.5 text-xs font-oswald uppercase">
                <div className="flex justify-between text-mute">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Promo Discount</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-mute">
                  <span>Shipping</span>
                  <span className="text-camelDeep font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-sm text-ink font-semibold pt-2 border-t border-line">
                  <span>Total</span>
                  <span className="text-camelDeep">{formatINR(total)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="block w-full bg-ink text-bg text-center py-4 rounded-sm font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-all min-h-[44px] flex items-center justify-center shadow-sm2 cursor-pointer"
                >
                  Proceed to Checkout — {formatINR(total)}
                </button>

                <Link
                  href="/bag"
                  onClick={() => setCartDrawerOpen(false)}
                  className="block text-center font-oswald text-xs tracking-wider uppercase text-mute hover:text-ink py-1"
                >
                  View Full Cart & Coupons →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
