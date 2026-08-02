'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';

type WishlistContextType = {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  toggleWishlist: async () => {},
  isWishlisted: () => false,
  wishlistCount: 0,
});

const STORAGE_KEY = 'dvero_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const userId = session?.user?.id;

  const fetchWishlist = useCallback(async () => {
    if (userId) {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', userId);

      const dbIds = (data || []).map((row: { product_id: string }) => row.product_id);
      const userStorageKey = `dvero_wishlist_${userId}`;
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem(userStorageKey) : null;
      if (localRaw) {
        try {
          const guestIds: string[] = JSON.parse(localRaw);
          if (Array.isArray(guestIds) && guestIds.length > 0) {
            const newIds = guestIds.filter(id => !dbIds.includes(id));
            if (newIds.length > 0) {
              const rowsToInsert = newIds.map(id => ({ user_id: userId, product_id: id }));
              await supabase.from('wishlists').insert(rowsToInsert);
              dbIds.push(...newIds);
            }
          }
          localStorage.removeItem(userStorageKey);
        } catch (e) {}
      }
      setWishlist(Array.from(new Set(dbIds)));
    } else {
      const guestKey = 'dvero_wishlist_guest';
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem(guestKey) : null;
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          setWishlist(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
    }
  }, [userId]);

  useEffect(() => {
    setWishlist([]);
    fetchWishlist();
  }, [userId, fetchWishlist]);

  const toggleWishlist = async (productId: string) => {
    const exists = wishlist.includes(productId);
    const updated = exists ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
    setWishlist(updated);

    if (userId) {
      if (exists) {
        await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
      } else {
        await supabase.from('wishlists').insert([{ user_id: userId, product_id: productId }]);
      }
    } else {
      localStorage.setItem('dvero_wishlist_guest', JSON.stringify(updated));
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, wishlistCount: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
