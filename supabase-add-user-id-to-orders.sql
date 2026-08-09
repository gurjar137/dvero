-- ============================================================
-- D'VERO — Supabase Orders Table Fix & User ID Foreign Key Migration
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Ensure user_id column exists on public.orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add index for faster customer order querying
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 3. Ensure order_notes and shipping_method exist on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'standard';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- 4. Enable Row Level Security (RLS) on orders & order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies on public.orders for clean re-creation
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own or admin orders" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;

-- 6. Create robust security-focused RLS policies for orders
-- INSERT: Authenticated customers insert own orders (user_id = auth.uid()), guest orders (user_id IS NULL)
CREATE POLICY "Customers insert own orders" ON public.orders
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND user_id IS NULL)
  OR public.is_admin()
);

-- SELECT: Customers read own orders by user_id OR matching email; Admins read all
CREATE POLICY "Users read own or admin orders" ON public.orders
FOR SELECT USING (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email')))
  OR public.is_admin()
);

-- UPDATE: Customers can update own orders; Admins can update all
CREATE POLICY "Users update own or admin orders" ON public.orders
FOR UPDATE USING (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))) 
  OR public.is_admin()
);

-- DELETE: Admins only
CREATE POLICY "Admins delete orders" ON public.orders
FOR DELETE USING (
  public.is_admin()
);

-- 7. Drop existing policies on public.order_items
DROP POLICY IF EXISTS "Public can add order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins full access order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert order items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users read order items for own orders" ON public.order_items;

-- 8. Create security-focused RLS policies for order_items
CREATE POLICY "Users insert order items for own orders" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        (orders.user_id IS NOT NULL AND orders.user_id = auth.uid()) 
        OR orders.email = (auth.jwt() ->> 'email') 
        OR auth.uid() IS NULL 
        OR public.is_admin()
      )
  )
);

CREATE POLICY "Users read order items for own orders" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        (orders.user_id IS NOT NULL AND orders.user_id = auth.uid()) 
        OR orders.email = (auth.jwt() ->> 'email') 
        OR public.is_admin()
      )
  )
);

-- 9. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
