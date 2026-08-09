'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { CartItem, SavedItem, Coupon } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useProducts } from '@/lib/useProducts';
import { GuestCartNoticeModal } from './GuestCartNoticeModal';
import { Toast } from './Toast';

type CartContextType = {
  cart: CartItem[];
  savedForLater: SavedItem[];
  addToCart: (id: string, size: string, qty: number, productName?: string) => void;
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

/**
 * Deduplicates and cleans cart items by (id + size).
 * Prevents multiple entries for the same product variant and ensures valid numeric quantities.
 * Mode 'load': when reading raw stored items, deduplicate array elements using max qty rather than compounding stale duplicate writes.
 * Mode 'merge': when user explicitly adds items, merge quantities.
 */
function sanitizeAndDeduplicateCart(items: any[], mode: 'load' | 'merge' = 'merge'): CartItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, CartItem>();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String(raw.id || '').trim();
    const size = String(raw.size || '').trim();
    const qty = Math.max(0, parseInt(String(raw.qty), 10) || 0);

    if (!id || !size || qty <= 0) continue;

    const key = `${id}__${size}`;
    const existing = map.get(key);
    if (existing) {
      if (mode === 'load') {
        map.set(key, { ...existing, qty: Math.max(existing.qty, qty) });
      } else {
        map.set(key, { ...existing, qty: existing.qty + qty });
      }
    } else {
      map.set(key, { id, size, qty });
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, loading: productsLoading, findProduct } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<SavedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [guestNoticeOpen, setGuestNoticeOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  // 1. Initial Load: Read from single CART_KEY and SAVED_KEY in localStorage once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        // Clean up legacy dynamic keys if present in localStorage to prevent stale merges
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('dvero_cart_') && k !== CART_KEY) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        const storedCart = localStorage.getItem(CART_KEY);
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          const validCart = sanitizeAndDeduplicateCart(parsed, 'load');
          setCart(validCart);
        }

        const storedSaved = localStorage.getItem(SAVED_KEY);
        if (storedSaved) {
          const parsedSaved = JSON.parse(storedSaved);
          if (Array.isArray(parsedSaved)) {
            setSavedForLater(parsedSaved.filter(item => item && item.id && item.size));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist cart to single CART_KEY whenever cart changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (cart.length === 0) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
      } else {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      }
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart, isLoaded]);

  // 3. Persist savedForLater whenever it changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedForLater));
    } catch (e) {
      console.error('Failed to save savedForLater to localStorage:', e);
    }
  }, [savedForLater, isLoaded]);

  // 4. Cross-tab synchronization via window storage event
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === CART_KEY) {
        if (!e.newValue) {
          setCart([]);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setCart(sanitizeAndDeduplicateCart(parsed, 'load'));
          } catch (err) {}
        }
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 5. Automatically prune stale/phantom items whose products no longer exist
  useEffect(() => {
    if (isLoaded && !productsLoading) {
      setCart(prev => {
        const valid = prev.filter(item => item && item.id && item.size && Number(item.qty) > 0 && Boolean(findProduct(item.id)));
        if (valid.length !== prev.length) {
          return valid;
        }
        return prev;
      });
    }
  }, [isLoaded, productsLoading, products, findProduct]);

  // Reset applied coupons on auth state change (e.g. logout)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setAppliedCoupon(null);
      setCouponError(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const addToCart = useCallback((id: string, size: string, qty: number, productName?: string) => {
    const cleanId = String(id || '').trim();
    const cleanSize = String(size || '').trim();
    const addQty = Math.max(1, parseInt(String(qty), 10) || 1);

    if (!cleanId || !cleanSize) return;

    setCart(prev => {
      const idx = prev.findIndex(c => c.id === cleanId && c.size === cleanSize);
      let next: CartItem[];
      if (idx >= 0) {
        next = prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty + addQty } : item
        );
      } else {
        next = [...prev, { id: cleanId, size: cleanSize, qty: addQty }];
      }
      return sanitizeAndDeduplicateCart(next, 'merge');
    });

    setToastMsg(productName ? `Added ${productName} to Bag` : 'Added to Bag');

    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(GUEST_NOTICE_KEY);
      if (!seen) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setGuestNoticeOpen(true);
            localStorage.setItem(GUEST_NOTICE_KEY, 'true');
          }
        });
      }
    }
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    const cleanQty = parseInt(String(qty), 10);
    if (isNaN(cleanQty) || cleanQty < 1) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const next = prev.map((c, i) => (i === index ? { ...c, qty: cleanQty } : c));
      return sanitizeAndDeduplicateCart(next, 'merge');
    });
  }, [removeFromCart]);

  const moveToSaveForLater = useCallback((index: number) => {
    setCart(prev => {
      const item = prev[index];
      if (!item) return prev;
      setSavedForLater(savedPrev => {
        if (savedPrev.some(s => s.id === item.id && s.size === item.size)) return savedPrev;
        return [...savedPrev, { id: item.id, size: item.size }];
      });
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const moveToCartFromSaved = useCallback((index: number) => {
    setSavedForLater(prev => {
      const item = prev[index];
      if (!item) return prev;
      addToCart(item.id, item.size, 1);
      return prev.filter((_, i) => i !== index);
    });
  }, [addToCart]);

  const removeSavedItem = useCallback((index: number) => {
    setSavedForLater(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponError(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_KEY);
      } catch (e) {}
    }
  }, []);

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

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  const calcDiscount = useCallback((subtotal: number): number => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.min_spend) return 0;
    if (appliedCoupon.discount_type === 'percent') {
      return Math.round((subtotal * appliedCoupon.discount_value) / 100);
    }
    return Math.min(subtotal, appliedCoupon.discount_value);
  }, [appliedCoupon]);

  const validCartItems = productsLoading
    ? cart.filter(c => c && c.id && c.size && Number(c.qty) > 0)
    : cart.filter(c => c && c.id && c.size && Number(c.qty) > 0 && Boolean(findProduct(c.id)));
  const cartCount = validCartItems.reduce((s, c) => s + (Number(c.qty) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart: validCartItems,
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
      {toastMsg && <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} duration={2500} />}
      <GuestCartNoticeModal isOpen={guestNoticeOpen} onClose={() => setGuestNoticeOpen(false)} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

