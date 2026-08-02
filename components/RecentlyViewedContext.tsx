'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type RecentlyViewedContextType = {
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
  recentlyViewed: [],
  addRecentlyViewed: () => {},
});

const STORAGE_KEY = 'dvero_recently_viewed';
const MAX_ITEMS = 12;

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyViewed(parsed.slice(0, MAX_ITEMS));
        }
      }
    } catch (e) {
      console.error('Error reading recently viewed', e);
    }
  }, []);

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving recently viewed', e);
      }
      return updated;
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext);
}
