import { supabaseServer } from './supabase/server';
import { DEFAULT_SETTINGS } from './products';
import { SiteSettings, Product } from './types';
import { typeFromCategory } from './utils';

export async function getHomepageSettings(): Promise<SiteSettings> {
  try {
    const { data } = await supabaseServer.from('settings').select('*');
    if (!data) return DEFAULT_SETTINGS;
    const next: any = { ...DEFAULT_SETTINGS };
    data.forEach((row: any) => {
      next[row.key] = row.value;
    });
    return next;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function getHomepageProducts(): Promise<Product[]> {
  try {
    const { data } = await supabaseServer.from('products').select('*').order('created_at', { ascending: true });
    if (!data) return [];
    return data.map(row => ({ ...row, type: typeFromCategory(row.category) })) as Product[];
  } catch (e) {
    return [];
  }
}

