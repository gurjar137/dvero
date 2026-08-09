-- ============================================================
-- D'VERO — Supabase RLS Fixes for Coupons & Orders (Idempotent)
-- Execute this script in the Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. HELPER FUNCTION: is_admin()
-- Returns true if the authenticated user has role 'admin' or 'staff' in public.profiles,
-- or has admin role in auth JWT metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check public.profiles for role
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IN ('admin', 'staff') THEN
    RETURN TRUE;
  END IF;

  -- Fallback check for JWT metadata
  IF (auth.jwt() ->> 'role') IN ('admin', 'staff')
     OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
     OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'staff') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Grant execution privileges to all roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;


-- 2. COUPONS TABLE: Validation Constraints & RLS Policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing coupon policies to prevent duplicates/conflicts
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins full access coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins select coupons" ON public.coupons;

-- Add database constraints for coupon validation
DO $$
BEGIN
  ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_value_check;
  ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_min_spend_check;

  ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_discount_value_check
    CHECK (discount_value >= 1 AND (discount_type != 'percent' OR discount_value <= 100));

  ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_min_spend_check
    CHECK (min_spend >= 0);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Coupon RLS Policies
-- SELECT: Customers/Public read active coupons for checkout; Admins read all
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT
  USING (active = true OR public.is_admin());

-- INSERT: Authorized admin users only
CREATE POLICY "Admins insert coupons" ON public.coupons
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin());

-- UPDATE: Authorized admin users only
CREATE POLICY "Admins update coupons" ON public.coupons
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.is_admin())
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin());

-- DELETE: Authorized admin users only
CREATE POLICY "Admins delete coupons" ON public.coupons
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.is_admin());


-- 3. ORDERS TABLE: Add user_id column & RLS Policies
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing order policies
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;

-- Orders RLS Policies
-- INSERT: Authenticated customers insert own orders (user_id = auth.uid()) or Admin inserts
CREATE POLICY "Customers insert own orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
  );

-- SELECT: Customer reads own orders by user_id or email; Admin reads all orders
CREATE POLICY "Users read own or admin orders" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR email = (auth.jwt() ->> 'email')
    OR public.is_admin()
  );

-- UPDATE: Customer updates own order (cancellation) or Admin updates any order
CREATE POLICY "Users update own or admin orders" ON public.orders
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
  ) WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
  );

-- DELETE: Admins only
CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE USING (public.is_admin());


-- 4. ORDER ITEMS TABLE: RLS Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can add order items" ON public.order_items;
DROP POLICY IF EXISTS "Public read order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert order items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users read order items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins full access order_items" ON public.order_items;

-- Order Items RLS Policies
CREATE POLICY "Users insert order items for own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND ((orders.user_id IS NOT NULL AND orders.user_id = auth.uid()) OR orders.email = (auth.jwt() ->> 'email') OR public.is_admin())
    )
  );

CREATE POLICY "Users read order items for own orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND ((orders.user_id IS NOT NULL AND orders.user_id = auth.uid()) OR orders.email = (auth.jwt() ->> 'email') OR public.is_admin())
    )
  );

CREATE POLICY "Admins update order items" ON public.order_items
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete order items" ON public.order_items
  FOR DELETE USING (public.is_admin());

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
