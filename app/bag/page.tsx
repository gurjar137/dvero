'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/CartContext';
import { useProducts } from '@/lib/useProducts';
import { useSettings } from '@/lib/useSettings';
import { ProductVisual } from '@/components/GarmentIcon';
import { formatINR } from '@/lib/utils';

import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

export default function BagPage() {
  const router = useRouter();
  const { session } = useAuth();
  const {
    cart,
    savedForLater,
    removeFromCart,
    updateQty,
    moveToSaveForLater,
    moveToCartFromSaved,
    removeSavedItem,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    calcDiscount,
  } = useCart();
  const { findProduct } = useProducts();
  const { settings, shippingFor } = useSettings();
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  function handleCheckoutClick() {
    if (session?.user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=%2Fcheckout');
    }
  }

  const subtotal = cart.reduce((s, c) => {
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

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode) return;
    setApplying(true);
    const success = await applyCoupon(couponCode, subtotal);
    if (success) setCouponCode('');
    setApplying(false);
  }

  if (cart.length === 0 && savedForLater.length === 0) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh]">
        <h2 className="font-oswald text-2xl uppercase mb-3">Your Bag Is Empty</h2>
        <p className="text-mute mb-7 text-sm max-w-[30ch] mx-auto">Looks like you have not added any formalwear pieces yet.</p>
        <Link href="/" className="font-oswald text-xs tracking-widest uppercase bg-ink text-bg px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-colors inline-block">
          Continue Shopping →
        </Link>
      </main>
    );
  }

  return (
    <main className="page-fade py-8 md:py-16 min-h-[60vh] pb-24 md:pb-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Header Title */}
        <div className="mb-6 md:mb-9 flex justify-between items-end border-b border-line pb-4">
          <div>
            <h1 className="font-oswald text-2xl sm:text-3xl uppercase">Shopping Bag</h1>
            <p className="text-mute text-xs sm:text-sm mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/" className="font-oswald text-xs tracking-wider uppercase border-b border-ink hidden sm:inline">
            Continue Shopping →
          </Link>
        </div>

        {/* Free Shipping Progress Indicator */}
        {cart.length > 0 && (
          <div className="bg-panel border border-line rounded-md p-4 mb-6 shadow-sm2">
            <div className="flex justify-between items-center text-xs font-oswald uppercase tracking-wider mb-2">
              {awayFromFreeShipping > 0 ? (
                <span>Add <strong className="text-camelDeep">{formatINR(awayFromFreeShipping)}</strong> more for Free Shipping</span>
              ) : (
                <span className="text-success font-semibold">✓ You Unlocked Free Express Delivery!</span>
              )}
              <span>{freeShippingPct}%</span>
            </div>
            <div className="w-full bg-line h-2 rounded-full overflow-hidden">
              <div className="bg-camelDeep h-full transition-all duration-300" style={{ width: `${freeShippingPct}%` }} />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-[1.6fr_1fr] gap-6 md:gap-10 items-start">
          {/* Main Items List */}
          <div className="flex flex-col">
            {cart.map((c, i) => {
              const p = findProduct(c.id);
              if (!p) return null;
              return (
                <div key={i} className="grid grid-cols-[72px_1fr] sm:grid-cols-[90px_1.6fr_auto_auto] gap-3 sm:gap-5 items-center py-4 sm:py-5 border-b border-line">
                  <div className="w-[72px] h-[92px] sm:w-[90px] sm:h-[112px] bg-panel rounded-md border border-line flex items-center justify-center">
                    <div className="w-3/5"><ProductVisual image={p.images?.[0]} type={p.type} /></div>
                  </div>

                  <div className="min-w-0">
                    <div className="font-oswald text-sm uppercase mb-1 truncate">{p.name}</div>
                    <div className="text-xs text-mute mb-2">Size: {c.size}</div>

                    <div className="flex flex-wrap items-center gap-3 sm:hidden mb-2">
                      <div className="flex items-center border border-line rounded-sm bg-panel">
                        <button onClick={() => updateQty(i, c.qty - 1)} className="min-w-[36px] min-h-[36px] font-oswald text-sm">−</button>
                        <span className="min-w-[28px] text-center font-oswald text-xs">{c.qty}</span>
                        <button onClick={() => updateQty(i, c.qty + 1)} className="min-w-[36px] min-h-[36px] font-oswald text-sm">+</button>
                      </div>
                      <span className="font-oswald text-sm text-camelDeep">{formatINR(p.price * c.qty)}</span>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => moveToSaveForLater(i)} className="font-oswald text-[0.68rem] tracking-wider uppercase text-mute hover:text-ink">
                        Save For Later
                      </button>
                      <button onClick={() => removeFromCart(i)} className="font-oswald text-[0.68rem] tracking-wider uppercase text-mute hover:text-error">
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center border border-line rounded-sm bg-panel">
                    <button onClick={() => updateQty(i, c.qty - 1)} className="min-w-[32px] min-h-[32px] font-oswald text-sm">−</button>
                    <span className="min-w-[28px] text-center font-oswald text-xs">{c.qty}</span>
                    <button onClick={() => updateQty(i, c.qty + 1)} className="min-w-[32px] min-h-[32px] font-oswald text-sm">+</button>
                  </div>

                  <div className="hidden sm:block font-oswald text-sm text-camelDeep text-right min-w-[80px]">
                    {formatINR(p.price * c.qty)}
                  </div>
                </div>
              );
            })}

            {/* Save For Later Section */}
            {savedForLater.length > 0 && (
              <div className="mt-12 pt-8 border-t border-line">
                <h3 className="font-oswald text-lg uppercase mb-4">Saved For Later ({savedForLater.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedForLater.map((saved, idx) => {
                    const p = findProduct(saved.id);
                    if (!p) return null;
                    return (
                      <div key={idx} className="flex gap-3 p-3 bg-panel border border-line rounded-md items-center">
                        <div className="w-14 h-18 bg-bg border border-line rounded flex items-center justify-center">
                          <ProductVisual image={p.images?.[0]} type={p.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-oswald text-xs uppercase truncate">{p.name}</h4>
                          <p className="text-[0.7rem] text-mute">Size: {saved.size}</p>
                          <p className="font-oswald text-xs text-camelDeep mt-1">{formatINR(p.price)}</p>
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => moveToCartFromSaved(idx)} className="font-oswald text-[0.65rem] uppercase text-ink underline">
                              Move To Bag
                            </button>
                            <button onClick={() => removeSavedItem(idx)} className="font-oswald text-[0.65rem] uppercase text-mute hover:text-error">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          {cart.length > 0 && (
            <div className="bg-panel rounded-md border border-line shadow-md2 p-6 md:p-8 md:sticky md:top-24">
              <h3 className="font-oswald text-base uppercase mb-4 border-b border-line pb-3">Order Summary</h3>

              {/* Coupon Code Section */}
              <div className="mb-5 pb-5 border-b border-line">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. DVERO10)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="flex-1 bg-bg border border-line px-3 py-2 rounded-sm font-oswald text-xs uppercase outline-none focus:border-ink"
                  />
                  <button
                    type="submit"
                    disabled={applying}
                    className="bg-ink text-bg font-oswald text-xs uppercase px-4 py-2 rounded-sm hover:bg-camelDeep transition-colors min-h-[44px]"
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </form>

                {couponError && <p className="text-error text-xs font-oswald uppercase mt-2">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs font-oswald uppercase text-success mt-3 bg-bg p-2 rounded border border-line">
                    <span>{appliedCoupon.code} Applied (-{formatINR(discount)})</span>
                    <button onClick={removeCoupon} className="text-error">×</button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-mute">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-success font-oswald"><span>Coupon Discount</span><span>-{formatINR(discount)}</span></div>
                )}
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
              </div>

              <div className="flex justify-between font-oswald text-base pt-4 mt-4 border-t border-line text-ink font-semibold">
                <span>Total</span>
                <span className="text-camelDeep">{formatINR(total)}</span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="hidden md:block w-full text-center bg-ink text-bg py-4 rounded-sm font-oswald text-xs tracking-widest uppercase mt-6 hover:bg-camelDeep transition-colors shadow-sm2 cursor-pointer"
              >
                Proceed to Checkout — {formatINR(total)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Checkout Bar */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t border-line p-3 z-40 shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-[0.65rem] font-oswald uppercase text-mute">Total Amount</div>
            <div className="font-oswald text-base text-camelDeep font-semibold">{formatINR(total)}</div>
          </div>
          <button
            onClick={handleCheckoutClick}
            className="bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-6 py-3.5 rounded-sm hover:bg-camelDeep transition-colors min-h-[44px] flex items-center cursor-pointer"
          >
            Checkout →
          </button>
        </div>
      )}
    </main>
  );
}
