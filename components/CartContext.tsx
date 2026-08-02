'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { CartItem, SavedItem, Coupon } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { GuestCartNoticeModal } from './GuestCartNoticeModal';

type CartContextType = {
  cart: CartItem[];
  savedForLater: SavedItem[];
  addToCart: (id: string, size: string, qty: number) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, qty: number) => void;
  moveToSaveForLater: (index: number) => void;
  moveToCartFromSaved: (index: number) => void;
  removeSavedItem: (index: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string, subtotal: number) => Promise<boolean>;
  removeCoupon: () => void;
  calcDiscount: (subtotal: number) => number;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = 'dvero_cart';
const SAVED_KEY = 'dvero_saved_for_later';
const GUEST_NOTICE_KEY = 'dvero_guest_cart_notice_seen';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<SavedItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [guestNoticeOpen, setGuestNoticeOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id || null;
      setUserId(nextId);
      setAppliedCoupon(null);
      setCouponError(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const cartKey = `dvero_cart_${userId || 'guest'}`;
    const savedKey = `dvero_saved_${userId || 'guest'}`;
    try {
      const storedCart = localStorage.getItem(cartKey);
      setCart(storedCart ? JSON.parse(storedCart) : []);

      const storedSaved = localStorage.getItem(savedKey);
      setSavedForLater(storedSaved ? JSON.parse(storedSaved) : []);
    } catch {
      setCart([]);
      setSavedForLater([]);
    }
  }, [userId]);

  useEffect(() => {
    const cartKey = `dvero_cart_${userId || 'guest'}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, userId]);

  useEffect(() => {
    const savedKey = `dvero_saved_${userId || 'guest'}`;
    localStorage.setItem(savedKey, JSON.stringify(savedForLater));
  }, [savedForLater, userId]);

  async function addToCart(id: string, size: string, qty: number) {
    setCart(prev => {
      const idx = prev.findIndex(c => c.id === id && c.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { id, size, qty }];
    });

    // One-time guest cart notification check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const seen = localStorage.getItem(GUEST_NOTICE_KEY);
      if (!seen) {
        setGuestNoticeOpen(true);
        localStorage.setItem(GUEST_NOTICE_KEY, 'true');
      }
    }
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index));
  }

  function updateQty(index: number, qty: number) {
    if (qty < 1) return;
    setCart(prev => prev.map((c, i) => (i === index ? { ...c, qty } : c)));
  }

  function moveToSaveForLater(index: number) {
    const item = cart[index];
    if (!item) return;
    setCart(prev => prev.filter((_, i) => i !== index));
    setSavedForLater(prev => {
      if (prev.some(s => s.id === item.id && s.size === item.size)) return prev;
      return [...prev, { id: item.id, size: item.size }];
    });
  }

  function moveToCartFromSaved(index: number) {
    const item = savedForLater[index];
    if (!item) return;
    setSavedForLater(prev => prev.filter((_, i) => i !== index));
    addToCart(item.id, item.size, 1);
  }

  function removeSavedItem(index: number) {
    setSavedForLater(prev => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    setCart([]);
    setAppliedCoupon(null);
  }

  const applyCoupon = useCallback(async (code: string, subtotal: number): Promise<boolean> => {
    setCouponError(null);
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        setCouponError('Invalid or expired promo code.');
        return false;
      }

      if (subtotal < data.min_spend) {
        setCouponError(`Minimum spend of ₹${data.min_spend.toLocaleString()} required for ${cleanCode}.`);
        return false;
      }

      setAppliedCoupon(data as Coupon);
      return true;
    } catch (e) {
      setCouponError('Unable to validate coupon.');
      return false;
    }
  }, []);

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  function calcDiscount(subtotal: number): number {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.min_spend) return 0;
    if (appliedCoupon.discount_type === 'percent') {
      return Math.round((subtotal * appliedCoupon.discount_value) / 100);
    }
    return Math.min(subtotal, appliedCoupon.discount_value);
  }

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        savedForLater,
        addToCart,
        removeFromCart,
        updateQty,
        moveToSaveForLater,
        moveToCartFromSaved,
        removeSavedItem,
        clearCart,
        cartCount,
        cartDrawerOpen,
        setCartDrawerOpen,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        calcDiscount,
      }}
    >
      {children}
      <GuestCartNoticeModal isOpen={guestNoticeOpen} onClose={() => setGuestNoticeOpen(false)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
