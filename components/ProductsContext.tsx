'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product, InventoryRow } from '@/lib/types';
import { typeFromCategory } from '@/lib/utils';

type ProductsContextValue = {
  products: Product[];
  inventory: InventoryRow[];
  loading: boolean;
  stockFor: (productId: string, size: string) => number;
  findProduct: (id: string) => Product | undefined;
  reload: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

function normalizeProduct(row: any): Product {
  return { ...row, type: typeFromCategory(row.category) } as Product;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Full collection load — runs exactly once, for the very first
  // application load. Never called again by the realtime handlers below.
  const loadAll = useCallback(async () => {
    const [{ data: p, error: pErr }, { data: inv }] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: true }),
      supabase.from('inventory').select('*')
    ]);
    if (!pErr) {
      setProducts(((p as any[]) || []).map(normalizeProduct));
    }
    if (inv) setInventory(inv as InventoryRow[]);
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  // Targeted patch for a single changed product. Never touches `loading`,
  // never rebuilds the whole array, and preserves the object reference of
  // every product that didn't actually change.
  const patchProduct = useCallback(async (id: string, deleted: boolean) => {
    if (deleted) {
      setProducts(prev => (prev.some(item => item.id === id) ? prev.filter(item => item.id !== id) : prev));
      return;
    }

    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) return;

    // Product was deactivated or removed — drop it from the cache if present.
    if (!data || !(data as any).active) {
      setProducts(prev => (prev.some(item => item.id === id) ? prev.filter(item => item.id !== id) : prev));
      return;
    }

    const incoming = normalizeProduct(data);

    setProducts(prev => {
      const idx = prev.findIndex(item => item.id === id);

      if (idx === -1) {
        return [...prev, incoming].sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
      }

      const existing = prev[idx];
      if (JSON.stringify(existing) === JSON.stringify(incoming)) {
        // Nothing actually changed — keep the exact same array reference.
        return prev;
      }

      const next = prev.slice();
      next[idx] = incoming;
      return next;
    });
  }, []);

  // Targeted patch for inventory rows belonging to a single product.
  const patchInventory = useCallback(async (productId: string) => {
    const { data, error } = await supabase.from('inventory').select('*').eq('product_id', productId);
    if (error) return;
    const freshRows = (data as InventoryRow[]) || [];

    setInventory(prev => {
      const others = prev.filter(row => row.product_id !== productId);
      const unchanged =
        others.length === prev.length - freshRows.length &&
        freshRows.every(fresh => prev.some(row => row.product_id === fresh.product_id && row.size === fresh.size && row.stock === fresh.stock));
      if (unchanged) return prev;
      return [...others, ...freshRows];
    });
  }, []);

  useEffect(() => {
    loadAll();

    // Exactly one realtime channel for the lifetime of the app — this
    // effect runs once because ProductsProvider lives in the root layout,
    // which never remounts on route changes.
    const channel = supabase.channel('storefront-products-global');

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
      const id = (payload.new as any)?.id || (payload.old as any)?.id;
      if (!id) return;
      patchProduct(id, payload.eventType === 'DELETE');
    });

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
      const productId = (payload.new as any)?.product_id || (payload.old as any)?.product_id;
      if (!productId) return;
      patchInventory(productId);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stockFor = useCallback(
    (productId: string, size: string): number => {
      const row = inventory.find(i => i.product_id === productId && i.size === size);
      return row ? row.stock : 99;
    },
    [inventory]
  );

  const findProduct = useCallback((id: string) => products.find(p => p.id === id), [products]);

  return (
    <ProductsContext.Provider value={{ products, inventory, loading, stockFor, findProduct, reload: loadAll }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProductsContext() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProducts() must be used within a ProductsProvider');
  }
  return ctx;
}
