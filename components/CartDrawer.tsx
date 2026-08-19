'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useProducts } from '@/lib/useProducts';
import { useWishlist } from './WishlistContext';
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
  const { products, findProduct } = useProducts();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // 1. Manage Body Scroll Lock
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
  const shipping = 0; // FREE Shipping on all orders
  const total = discountedSubtotal + shipping;

  // Recommendations (take first 4 available products)
  const recommendedProducts = products.slice(0, 4);

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) setCartDrawerOpen(false);
      }}
      className="fixed inset-0 z-[2000] overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn transition-all duration-300"
    >
      {/* Drawer Container (Desktop Right Drawer / Mobile Bottom Sheet) */}
      <div
        className="w-full sm:w-[460px] h-full bg-[#FAF9F6] text-[#111111] border-l border-[#EBE8E1] shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft rounded-t-[28px] sm:rounded-none mt-auto sm:mt-0 max-h-[90vh] sm:max-h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-4 sm:px-6 border-b border-[#EBE8E1] flex justify-between items-center bg-[#FAF9F6] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-playfair text-lg sm:text-xl uppercase tracking-[0.15em] font-normal text-[#111111]">
              YOUR BAG
            </h2>
            <span className="font-inter text-[0.68rem] text-[#666666] tracking-wider uppercase font-semibold bg-[#EFECE6] px-2.5 py-0.5 rounded-full">
              {validItems.length} {validItems.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          {/* Close X Button */}
          <button
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart"
            className="p-2 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* SUBTLE SINGLE-LINE SHIPPING BENEFIT */}
        <div className="bg-[#F6F4ED] border-b border-[#EBE8E1] py-2.5 px-4 flex items-center justify-center gap-2 text-[0.68rem] sm:text-xs font-inter uppercase tracking-wider text-[#111111] font-medium shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-4 h-4 text-[#111111] shrink-0">
            <path d="M5 17h-2v-11h11v11h-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 9h4l3 3v5h-2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span>FREE SHIPPING ON ALL ORDERS</span>
        </div>

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin touch-pan-y">
          {validItems.length === 0 ? (
            /* EMPTY BAG STATE */
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center py-8 px-4 bg-white border border-[#EBE8E1] rounded-2xl shadow-2xs">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  className="w-10 h-10 text-[#888888] mx-auto mb-3"
                >
                  <path d="M6 8h12l1 13H5L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="font-playfair text-base sm:text-lg uppercase tracking-[0.15em] text-[#111111] font-normal mb-1">
                  YOUR BAG IS EMPTY
                </h3>
                <p className="font-inter text-xs text-[#666666] font-light mb-5 max-w-[28ch] mx-auto">
                  Discover pieces made for your everyday style.
                </p>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="inline-flex items-center gap-2 bg-[#111111] text-white font-inter text-xs tracking-[0.15em] uppercase px-5 py-3 rounded-lg hover:bg-[#333333] transition-colors font-medium shadow-2xs cursor-pointer"
                >
                  <span>EXPLORE COLLECTION</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="block mx-auto font-inter text-[0.72rem] text-[#888888] hover:text-[#111111] underline cursor-pointer mt-3"
                >
                  Continue Shopping
                </button>
              </div>

              {/* RECOMMENDED PRODUCTS SECTION */}
              {recommendedProducts.length > 0 && (
                <section className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                      YOU MAY ALSO LIKE
                    </h4>
                    <Link
                      href="/category/shirts"
                      onClick={() => setCartDrawerOpen(false)}
                      className="font-inter text-[0.68rem] tracking-wider uppercase text-[#111111] hover:underline font-medium"
                    >
                      VIEW ALL →
                    </Link>
                  </div>

                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                    {recommendedProducts.map(rec => {
                      const wishlisted = isWishlisted(rec.id);
                      const imageUrl = rec.images?.[0];

                      return (
                        <div
                          key={rec.id}
                          className="w-32 sm:w-36 shrink-0 bg-white border border-[#EBE8E1] rounded-xl overflow-hidden shadow-2xs group flex flex-col justify-between"
                        >
                          <div className="relative aspect-[3/4] w-full bg-[#F0EFEA] overflow-hidden flex items-center justify-center">
                            <Link
                              href={`/product/${rec.id}`}
                              onClick={() => setCartDrawerOpen(false)}
                              className="w-full h-full block"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={rec.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <ProductVisual image={imageUrl} type={rec.type} />
                              )}
                            </Link>

                            <button
                              type="button"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(rec.id);
                              }}
                              aria-label="Wishlist"
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:scale-110 transition-all z-10 shadow-2xs"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill={wishlisted ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={1.5}
                                className={`w-3 h-3 ${wishlisted ? 'text-[#111111]' : 'text-[#666666]'}`}
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                            </button>
                          </div>

                          <div className="p-2.5 flex flex-col justify-between flex-1">
                            <Link
                              href={`/product/${rec.id}`}
                              onClick={() => setCartDrawerOpen(false)}
                              className="block"
                            >
                              <h5 className="font-playfair text-[0.72rem] sm:text-xs uppercase tracking-wide text-[#111111] font-normal truncate group-hover:text-[#666666] transition-colors">
                                {rec.name}
                              </h5>
                              <p className="font-inter text-xs font-semibold text-[#111111] mt-0.5">
                                {formatINR(rec.price)}
                              </p>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* FILLED CART ITEMS LIST */
            <div className="space-y-4 animate-fadeIn">
              {validItems.map((item, index) => {
                const p = findProduct(item.id);
                if (!p) return null;
                const imageUrl = p.images?.[0];

                return (
                  <div
                    key={`${item.id}-${item.size}-${index}`}
                    className="flex gap-3.5 pb-4 border-b border-[#EBE8E1] items-start bg-white p-3.5 rounded-xl border border-[#EBE8E1]/80 shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-20 bg-[#F0EFEA] rounded-lg overflow-hidden border border-[#EBE8E1] flex items-center justify-center shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ProductVisual image={imageUrl} type={p.type} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-playfair text-xs sm:text-sm uppercase tracking-wide font-normal truncate text-[#111111]">
                          {p.name}
                        </h4>
                        <span className="font-inter text-xs font-semibold text-[#111111] ml-2">
                          {formatINR(p.price * item.qty)}
                        </span>
                      </div>

                      <p className="font-inter text-[0.72rem] text-[#666666]">Size: {item.size}</p>

                      {/* Quantity Selector & Actions */}
                      <div className="flex items-center justify-between pt-1.5">
                        {/* Quantity Pill Selector */}
                        <div className="flex items-center border border-[#EBE8E1] rounded-full bg-[#FAF9F6] px-1.5 py-0.5 text-xs font-inter">
                          <button
                            type="button"
                            onClick={() => updateQty(index, item.qty - 1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="px-2.5 font-medium text-xs text-[#111111]">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(index, item.qty + 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Save & Remove Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => moveToSaveForLater(index)}
                            className="text-[0.68rem] font-inter uppercase tracking-wider text-[#888888] hover:text-[#111111] underline cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(index)}
                            aria-label="Remove item"
                            className="text-[0.68rem] font-inter uppercase tracking-wider text-[#888888] hover:text-[#DC2626] transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* RECOMMENDED PRODUCTS BELOW FILLED ITEMS */}
              {recommendedProducts.length > 0 && (
                <section className="space-y-3 pt-4 border-t border-[#EBE8E1]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                      YOU MAY ALSO LIKE
                    </h4>
                    <Link
                      href="/category/shirts"
                      onClick={() => setCartDrawerOpen(false)}
                      className="font-inter text-[0.68rem] tracking-wider uppercase text-[#111111] hover:underline font-medium"
                    >
                      VIEW ALL →
                    </Link>
                  </div>

                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                    {recommendedProducts.map(rec => {
                      const wishlisted = isWishlisted(rec.id);
                      const imageUrl = rec.images?.[0];

                      return (
                        <div
                          key={`filled-rec-${rec.id}`}
                          className="w-32 sm:w-36 shrink-0 bg-white border border-[#EBE8E1] rounded-xl overflow-hidden shadow-2xs group flex flex-col justify-between"
                        >
                          <div className="relative aspect-[3/4] w-full bg-[#F0EFEA] overflow-hidden flex items-center justify-center">
                            <Link
                              href={`/product/${rec.id}`}
                              onClick={() => setCartDrawerOpen(false)}
                              className="w-full h-full block"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={rec.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <ProductVisual image={imageUrl} type={rec.type} />
                              )}
                            </Link>

                            <button
                              type="button"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(rec.id);
                              }}
                              aria-label="Wishlist"
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:scale-110 transition-all z-10 shadow-2xs"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill={wishlisted ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={1.5}
                                className={`w-3 h-3 ${wishlisted ? 'text-[#111111]' : 'text-[#666666]'}`}
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                            </button>
                          </div>

                          <div className="p-2.5 flex flex-col justify-between flex-1">
                            <Link
                              href={`/product/${rec.id}`}
                              onClick={() => setCartDrawerOpen(false)}
                              className="block"
                            >
                              <h5 className="font-playfair text-[0.72rem] sm:text-xs uppercase tracking-wide text-[#111111] font-normal truncate group-hover:text-[#666666] transition-colors">
                                {rec.name}
                              </h5>
                              <p className="font-inter text-xs font-semibold text-[#111111] mt-0.5">
                                {formatINR(rec.price)}
                              </p>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* FOOTER: SUMMARY, BENEFITS & CHECKOUT */}
        <div className="p-5 sm:p-6 border-t border-[#EBE8E1] bg-[#FAF9F6] space-y-4 shrink-0">
          {/* BENEFITS ROW */}
          <div className="grid grid-cols-3 gap-2 border-b border-[#EBE8E1] pb-3 text-center">
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="w-4 h-4 text-[#111111] mb-1">
                <path d="M4 12v-3a8 8 0 0 1 14.93-3.73" strokeLinecap="round" />
                <path d="M20 12v3a8 8 0 0 1-14.93 3.73" strokeLinecap="round" />
                <polyline points="1 9 4 12 7 9" />
                <polyline points="23 15 20 12 17 15" />
              </svg>
              <span className="font-inter text-[0.68rem] font-medium text-[#111111] uppercase tracking-wide">Easy Returns</span>
              <span className="font-inter text-[0.62rem] text-[#777777]">14-day returns</span>
            </div>

            <div className="flex flex-col items-center border-x border-[#EBE8E1]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="w-4 h-4 text-[#111111] mb-1">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
              </svg>
              <span className="font-inter text-[0.68rem] font-medium text-[#111111] uppercase tracking-wide">Secure Checkout</span>
              <span className="font-inter text-[0.62rem] text-[#777777]">Safe & protected</span>
            </div>

            <div className="flex flex-col items-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="w-4 h-4 text-[#111111] mb-1">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-inter text-[0.68rem] font-medium text-[#111111] uppercase tracking-wide">Quality Assured</span>
              <span className="font-inter text-[0.62rem] text-[#777777]">Premium fabrics</span>
            </div>
          </div>

          {/* ORDER SUMMARY (If items exist) */}
          {validItems.length > 0 && (
            <div className="space-y-2">
              {appliedCoupon && (
                <div className="flex justify-between items-center text-xs font-inter uppercase text-[#166534] bg-[#F0FDF4] p-2.5 rounded-lg border border-[#BBF7D0]">
                  <span>Code: {appliedCoupon.code} applied (-{formatINR(discount)})</span>
                  <button onClick={removeCoupon} className="text-[#DC2626] font-medium ml-2 cursor-pointer">
                    Remove ×
                  </button>
                </div>
              )}

              <div className="space-y-1.5 text-xs font-inter uppercase">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#111111]">{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#166534]">
                    <span>Promo Discount</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#666666]">
                  <span>Shipping</span>
                  <span className="text-[#111111] font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-sm text-[#111111] font-semibold pt-2 border-t border-[#EBE8E1]">
                  <span>TOTAL</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              {/* PRIMARY CHECKOUT CTA */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-[#111111] text-white text-center py-3.5 rounded-xl font-inter text-xs tracking-[0.15em] uppercase hover:bg-[#333333] transition-all font-medium flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>CHECKOUT</span>
                  <span>→</span>
                  <span className="ml-1 opacity-80">({formatINR(total)})</span>
                </button>

                <Link
                  href="/bag"
                  onClick={() => setCartDrawerOpen(false)}
                  className="block text-center font-inter text-[0.72rem] tracking-wider uppercase text-[#888888] hover:text-[#111111] underline py-1"
                >
                  View Full Cart & Coupons
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
