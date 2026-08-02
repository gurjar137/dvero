'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product, InventoryRow, Order, Profile, SiteSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/products';
import { typeFromCategory } from '@/lib/utils';

export function useAdminData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    const normalized = ((data as any[]) || []).map(row => ({ ...row, type: typeFromCategory(row.category) })) as Product[];
    setProducts(normalized);
  }, []);
  const loadInventory = useCallback(async () => {
    const { data } = await supabase.from('inventory').select('*').order('product_id');
    setInventory((data as InventoryRow[]) || []);
  }, []);
  const loadOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
  }, []);
  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const next: any = { ...DEFAULT_SETTINGS };
      data.forEach((r: any) => { next[r.key] = r.value; });
      setSettings(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dvero_settings_cache', JSON.stringify(next));
      }
    }
  }, []);
  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    setProfiles((data as Profile[]) || []);
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadProducts(), loadInventory(), loadOrders(), loadSettings(), loadProfiles()]);
    setLoaded(true);
  }, [loadProducts, loadInventory, loadOrders, loadSettings, loadProfiles]);

  useEffect(() => {
    loadAll();

    const syncHandler = () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        if (cached) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
          } catch (e) {}
        }
      }
      loadSettings();
    };

    window.addEventListener('dvero_settings_updated', syncHandler);

    const channel = supabase.channel(`admin-live-${Math.random().toString(36).slice(2)}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, loadInventory);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, loadSettings);
    channel.subscribe();

    return () => {
      window.removeEventListener('dvero_settings_updated', syncHandler);
      supabase.removeChannel(channel);
    };
  }, [loadAll, loadOrders, loadProducts, loadInventory, loadSettings]);

  function stockForProduct(productId: string) {
    return inventory.filter(i => i.product_id === productId).reduce((s, i) => s + i.stock, 0);
  }
  function productNameById(id: string) {
    return products.find(p => p.id === id)?.name || id;
  }

  return {
    products, inventory, orders, settings, profiles, loaded,
    loadProducts, loadInventory, loadOrders, loadSettings, loadProfiles,
    stockForProduct, productNameById
  };
}
