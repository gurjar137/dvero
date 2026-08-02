-- ============================================================
-- D'VERO — Schema Cache & Order Notes Fix Migration
-- Run this in Supabase SQL Editor to add order_notes & reload schema cache
-- ============================================================

-- 1. Ensure columns exist on public.orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'standard';

-- 2. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
