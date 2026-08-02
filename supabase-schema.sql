-- ============================================================
-- D'VERO — Full Supabase Schema (idempotent — safe to re-run)
-- Run this whole file in Supabase SQL Editor
-- ============================================================

-- ---------- PRODUCTS ----------
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,            -- 'Shirts' | 'Trousers'
  fit_type text,
  fit_slug text,
  price numeric not null,
  fabric text,
  cut text,
  fit text,
  sizes jsonb not null default '[]',
  description text,
  care text,
  badge text,
  images jsonb not null default '[]', -- array of public image URLs
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If an older deployment already has a NOT NULL 'type' column, relax it so app writes
-- (which no longer send 'type') never fail. Safe no-op if the column doesn't exist.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'type') then
    alter table products alter column type drop not null;
    alter table products alter column type set default 'shirt';
  end if;
end $$;

-- ---------- INVENTORY ----------
create table if not exists inventory (
  id bigint generated always as identity primary key,
  product_id text references products(id) on delete cascade,
  size text not null,
  stock int not null default 0,
  unique(product_id, size)
);

-- ---------- ADMIN PROFILES ----------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'admin' check (role in ('admin','staff')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Widen profiles for full user directory (customers + admins) and allow self-management
alter table profiles add column if not exists email text;
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin','staff','customer'));
alter table profiles alter column role set default 'customer';

-- ---------- CUSTOMER ADDRESSES ----------
create table if not exists customer_addresses (
  id bigint generated always as identity primary key,
  customer_id uuid references auth.users on delete cascade not null,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id bigint generated always as identity primary key,
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  payment_method text not null,
  subtotal numeric not null,
  shipping numeric not null,
  total numeric not null,
  status text not null default 'processing' check (status in ('processing','packed','shipped','out_for_delivery','delivered','cancelled')),
  tracking_number text,
  delivery_date date,
  created_at timestamptz default now()
);

-- ---------- ORDER ITEMS ----------
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_id text references products(id),
  product_name text not null,
  size text not null,
  qty int not null,
  price numeric not null
);

-- ---------- SETTINGS ----------
create table if not exists settings (
  key text primary key,
  value jsonb not null
);
insert into settings (key, value) values
  ('free_shipping_threshold', '4999'),
  ('flat_shipping_rate', '149'),
  ('announcement_text', '"Free Shipping On Orders Over ₹4,999 · Easy 14-Day Returns"'),
  ('return_window_days', '14')
on conflict (key) do nothing;

-- ============================================================
-- HELPER: is_admin() — avoids recursive RLS lookups on profiles
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from profiles where id = auth.uid());
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table products enable row level security;
alter table inventory enable row level security;
alter table profiles enable row level security;
alter table customer_addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

-- Drop old policies if re-running
drop policy if exists "Public read active products" on products;
drop policy if exists "Admins full access products" on products;
drop policy if exists "Public read inventory" on inventory;
drop policy if exists "Admins full access inventory" on inventory;
drop policy if exists "Admins read own profile" on profiles;
drop policy if exists "Admins update own profile" on profiles;
drop policy if exists "Customers manage own addresses" on customer_addresses;
drop policy if exists "Admins read all addresses" on customer_addresses;
drop policy if exists "Public can place orders" on orders;
drop policy if exists "Customers read own orders" on orders;
drop policy if exists "Admins full access orders" on orders;
drop policy if exists "Public can add order items" on order_items;
drop policy if exists "Customers read own order items" on order_items;
drop policy if exists "Admins full access order_items" on order_items;
drop policy if exists "Public read settings" on settings;
drop policy if exists "Admins update settings" on settings;

-- PRODUCTS: everyone can read active products; admins do everything
create policy "Public read active products" on products for select using (active = true);
create policy "Admins full access products" on products for all
  using (is_admin()) with check (is_admin());

-- INVENTORY: everyone can read; admins write
create policy "Public read inventory" on inventory for select using (true);
create policy "Admins full access inventory" on inventory for all
  using (is_admin()) with check (is_admin());

-- PROFILES: any admin can read all admin/staff profiles; everyone can update only their own row
create policy "Admins read all profiles" on profiles for select using (is_admin());
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Admins update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create a profiles row for every new auth user (customer signups and admin-created logins alike)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'customer', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

update profiles set email = (select u.email from auth.users u where u.id = profiles.id) where email is null;

-- ADDRESSES: customers manage their own; admins can read all
create policy "Customers manage own addresses" on customer_addresses for all
  using (auth.uid() = customer_id) with check (auth.uid() = customer_id);
create policy "Admins read all addresses" on customer_addresses for select
  using (is_admin());

-- ORDERS: anyone (incl. guests) can place an order; customers can read their own by email; admins full access
create policy "Public can place orders" on orders for insert with check (true);
create policy "Customers read own orders" on orders for select
  using (email = auth.jwt() ->> 'email');
create policy "Admins full access orders" on orders for all
  using (is_admin()) with check (is_admin());

-- ORDER ITEMS: same pattern as orders
create policy "Public can add order items" on order_items for insert with check (true);
create policy "Customers read own order items" on order_items for select
  using (order_id in (select id from orders where email = auth.jwt() ->> 'email'));
create policy "Admins full access order_items" on order_items for all
  using (is_admin()) with check (is_admin());

-- SETTINGS: everyone reads; only admins write
create policy "Public read settings" on settings for select using (true);
create policy "Admins update settings" on settings for all
  using (is_admin()) with check (is_admin());

-- ============================================================
-- SEED PRODUCTS (only if table is empty)
-- ============================================================
insert into products (id, name, category, type, fit_type, fit_slug, price, fabric, cut, fit, sizes, description, care, badge)
select * from (values
('D-01','Collarless Shirt','Shirts','shirt',null,null,2199,'Ivory Silk-Cotton','Boxy Fit','Dropped Shoulder','["S","M","L","XL","XXL"]'::jsonb,'No collar, no fuss. A boxy silhouette in a silk-cotton blend soft enough for a twelve-hour day.','Hand wash cold or dry clean. Line dry in shade.','New'),
('D-02','Relaxed Shirt','Shirts','shirt',null,null,2349,'Camel Cotton','Relaxed Fit','Straight Hem','["S","M","L","XL","XXL"]'::jsonb,'An easy, straight-hem shirt in brushed camel cotton.','Machine wash cold. Line dry.',null),
('D-03','Straight Fit Trouser','Trousers','trouser','Straight Fit','straight-fit',2999,'Ash Grey Twill','Straight Leg','Mid Rise','["28","30","32","34","36","38"]'::jsonb,'The one trouser that works everywhere.','Machine wash cold. Hang dry.',null),
('D-04','Boot Cut Trouser','Trousers','trouser','Boot Cut','boot-cut',3199,'Charcoal Wool-Blend','Boot Cut','High Rise','["28","30","32","34","36","38"]'::jsonb,'A slight flare from the knee down.','Dry clean recommended.','New'),
('D-05','Baggy Fit Trouser','Trousers','trouser','Baggy Fit','baggy',2899,'Stone Chino','Baggy Fit','High Rise Wide Leg','["28","30","32","34","36","38"]'::jsonb,'Maximum room through the leg.','Machine wash cold.',null),
('D-06','Office Fit Trouser','Trousers','trouser','Office Fit','office-fit',3299,'Navy Twill','Tailored Straight','Mid Rise','["28","30","32","34","36","38"]'::jsonb,'The most formal cut in the line.','Dry clean only.','New')
) as v(id,name,category,type,fit_type,fit_slug,price,fabric,cut,fit,sizes,description,care,badge)
where not exists (select 1 from products);

insert into inventory (product_id, size, stock)
select p.id, s.value, 25
from products p, jsonb_array_elements_text(p.sizes) as s(value)
where not exists (select 1 from inventory)
on conflict (product_id, size) do nothing;

-- ============================================================
-- STORAGE: product-images bucket + public read policy
-- (Create the bucket named product-images from the Storage tab first,
--  with "Public bucket" turned ON — then run this section)
-- ============================================================
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins delete product images" on storage.objects;

create policy "Public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Admins upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "Admins update product images" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());
create policy "Admins delete product images" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());
