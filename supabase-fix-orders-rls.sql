-- ==============================================================================
-- D'VERO SUPABASE RLS FIX FOR ORDERS TABLE
-- Fixes "new row violates row-level security policy for table 'orders'"
-- ==============================================================================

-- 1. Ensure Row Level Security is enabled on public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy/invalid RLS policies on public.orders
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow guest and authenticated order creation" ON public.orders;
DROP POLICY IF EXISTS "Users read own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;

-- 3. INSERT POLICY:
--    a) Authenticated customers can insert orders matching their own customer_id (auth.uid() = customer_id)
--    b) Guest customers can insert orders with customer_id IS NULL
--    c) Admins can insert orders
CREATE POLICY "Allow guest and authenticated order creation" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid())
    OR (customer_id IS NULL)
    OR public.is_admin()
  );

-- 4. SELECT POLICY:
--    Customers read own orders by customer_id OR matching email; Admins read all
CREATE POLICY "Users read own or admin orders" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid())
    OR email = (auth.jwt() ->> 'email')
    OR public.is_admin()
  );

-- 5. UPDATE POLICY:
--    Customer updates own order (e.g. status cancellation) or Admin updates
CREATE POLICY "Users update own or admin orders" ON public.orders
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR public.is_admin()
  ) WITH CHECK (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR public.is_admin()
  );

-- 6. DELETE POLICY: Admins only
CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE USING (public.is_admin());
