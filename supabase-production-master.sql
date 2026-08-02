-- ============================================================
-- D'VERO — Complete Master Production Database Migration
-- Includes: All Tables, Columns, Foreign Keys, Indexes, RLS Policies & Schema Cache Reload
-- ============================================================

-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text default 'customer';

alter table public.profiles enable row level security;
drop policy if exists "Public profiles read" on public.profiles;
create policy "Public profiles read" on public.profiles for select using (true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  type text not null default 'shirt',
  fit_type text,
  fit_slug text,
  price numeric not null,
  fabric text,
  cut text,
  fit text,
  sizes text[] default '{}',
  description text,
  care text,
  badge text,
  images text[] default '{}',
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.products add column if not exists fabric text;
alter table public.products add column if not exists cut text;
alter table public.products add column if not exists fit text;
alter table public.products add column if not exists care text;
alter table public.products add column if not exists badge text;
alter table public.products add column if not exists active boolean default true;

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_fit_slug on public.products(fit_slug);

alter table public.products enable row level security;
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select using (true);

-- 3. INVENTORY TABLE
create table if not exists public.inventory (
  id bigint generated always as identity primary key,
  product_id text references public.products(id) on delete cascade not null,
  size text not null,
  stock integer not null default 0,
  reserved_stock integer not null default 0,
  created_at timestamptz default now()
);

alter table public.inventory add column if not exists reserved_stock integer default 0;
create index if not exists idx_inventory_product_size on public.inventory(product_id, size);

alter table public.inventory enable row level security;
drop policy if exists "Public read inventory" on public.inventory;
create policy "Public read inventory" on public.inventory for select using (true);

-- 4. ORDERS TABLE
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  payment_method text not null default 'upi',
  subtotal numeric not null,
  shipping numeric not null default 0,
  total numeric not null,
  status text not null default 'processing' check (status in ('processing', 'placed', 'pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  tracking_number text,
  delivery_date text,
  order_notes text,
  shipping_method text default 'standard',
  created_at timestamptz default now()
);

alter table public.orders add column if not exists order_notes text;
alter table public.orders add column if not exists shipping_method text default 'standard';
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists delivery_date text;

create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_email on public.orders(email);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

alter table public.orders enable row level security;
drop policy if exists "Public insert orders" on public.orders;
create policy "Public insert orders" on public.orders for insert with check (true);
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders for select using (email = auth.jwt() ->> 'email');

-- 5. ORDER ITEMS TABLE
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete cascade not null,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  size text not null,
  qty integer not null default 1,
  price numeric not null,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

alter table public.order_items enable row level security;
drop policy if exists "Public insert order items" on public.order_items;
create policy "Public insert order items" on public.order_items for insert with check (true);
drop policy if exists "Public read order items" on public.order_items;
create policy "Public read order items" on public.order_items for select using (true);

-- 6. CUSTOMER ADDRESSES TABLE
create table if not exists public.customer_addresses (
  id bigint generated always as identity primary key,
  customer_id uuid references auth.users(id) on delete cascade not null,
  label text default 'Home',
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);

alter table public.customer_addresses enable row level security;
drop policy if exists "Users manage own addresses" on public.customer_addresses;
create policy "Users manage own addresses" on public.customer_addresses for all using (auth.uid() = customer_id);

-- 7. PRODUCT REVIEWS TABLE
create table if not exists public.product_reviews (
  id bigint generated always as identity primary key,
  product_id text references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  verified_purchase boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);

alter table public.product_reviews enable row level security;
drop policy if exists "Public read reviews" on public.product_reviews;
create policy "Public read reviews" on public.product_reviews for select using (true);
drop policy if exists "Public insert reviews" on public.product_reviews;
create policy "Public insert reviews" on public.product_reviews for insert with check (true);

-- 8. COUPONS TABLE
create table if not exists public.coupons (
  id bigint generated always as identity primary key,
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  min_spend numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_coupons_code on public.coupons(code);

alter table public.coupons enable row level security;
drop policy if exists "Public read active coupons" on public.coupons;
create policy "Public read active coupons" on public.coupons for select using (active = true);

-- 9. RETURN REQUESTS TABLE
create table if not exists public.return_requests (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete cascade not null,
  customer_email text not null,
  type text not null check (type in ('return', 'exchange')),
  reason text not null,
  requested_size text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz default now()
);

create index if not exists idx_return_requests_order_id on public.return_requests(order_id);
create index if not exists idx_return_requests_email on public.return_requests(customer_email);

alter table public.return_requests enable row level security;
drop policy if exists "Public insert return requests" on public.return_requests;
create policy "Public insert return requests" on public.return_requests for insert with check (true);

-- 10. WISHLISTS TABLE
create table if not exists public.wishlists (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);

alter table public.wishlists enable row level security;
drop policy if exists "Users manage own wishlist" on public.wishlists;
create policy "Users manage own wishlist" on public.wishlists for all using (auth.uid() = user_id);

-- 11. SITE SETTINGS TABLE
create table if not exists public.settings (
  id bigint generated always as identity primary key,
  key text unique not null,
  value jsonb not null,
  created_at timestamptz default now()
);

alter table public.settings enable row level security;
drop policy if exists "Public read settings" on public.settings;
create policy "Public read settings" on public.settings for select using (true);

-- 12. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  event text not null,
  level text not null default 'info',
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- 13. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
