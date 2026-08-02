/**
 * D'VERO — Stock Reservation & Inventory Protection Engine
 */

import { supabase } from '@/lib/supabase/client';

export type StockValidationResult = {
  valid: boolean;
  outOfStockItems: Array<{ productId: string; size: string; requestedQty: number; availableQty: number }>;
};

export async function validateStockAvailability(cartItems: Array<{ id: string; size: string; qty: number }>): Promise<StockValidationResult> {
  const outOfStockItems: StockValidationResult['outOfStockItems'] = [];

  for (const item of cartItems) {
    const { data } = await supabase
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
