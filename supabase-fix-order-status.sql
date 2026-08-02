-- ============================================================
-- D'VERO — Orders Status Check Constraint Fix
-- Drops restrictive legacy check constraints and applies comprehensive status check
-- ============================================================

-- 1. Drop existing status check constraints on orders table
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add comprehensive, backward and forward compatible status check constraint
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('processing', 'placed', 'pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'));

-- 3. Update master production schema file as well
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'processing';

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
