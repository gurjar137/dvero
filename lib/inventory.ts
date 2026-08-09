/**
 * D'VERO — Stock Reservation & Inventory Protection Engine
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type StockValidationResult = {
  valid: boolean;
  outOfStockItems: Array<{ productId: string; size: string; requestedQty: number; availableQty: number }>;
};

export async function validateStockAvailability(
  cartItems: Array<{ id: string; size: string; qty: number }>,
  dbClient?: SupabaseClient
): Promise<StockValidationResult> {
  const outOfStockItems: StockValidationResult['outOfStockItems'] = [];

  let client = dbClient;
  if (!client) {
    if (typeof window !== 'undefined') {
      const { supabase } = await import('@/lib/supabase/client');
      client = supabase;
    } else {
      const { supabaseServer } = await import('@/lib/supabase/server');
      client = supabaseServer;
    }
  }

  for (const item of cartItems) {
    const { data } = await client
      .from('inventory')
      .select('stock')
      .eq('product_id', item.id)
      .eq('size', item.size)
      .maybeSingle();

    const available = data ? data.stock : 0;
    if (available < item.qty) {
      outOfStockItems.push({
        productId: item.id,
        size: item.size,
        requestedQty: item.qty,
        availableQty: available,
      });
    }
  }

  return {
    valid: outOfStockItems.length === 0,
    outOfStockItems,
  };
}

