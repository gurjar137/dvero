-- ============================================================
-- D'VERO — Phase 2 Database Migration
-- Coupons, Order Notes & Return/Exchange Requests
-- ============================================================

-- ---------- COUPONS ----------
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
create policy "Public read active coupons" on public.coupons
  for select using (active = true);

-- ---------- RETURN & EXCHANGE REQUESTS ----------
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
drop policy if exists "Customers read own return requests" on public.return_requests;

create policy "Public insert return requests" on public.return_requests
  for insert with check (true);

create policy "Customers read own return requests" on public.return_requests
  for select using (customer_email = auth.jwt() ->> 'email');

-- ---------- EXTEND ORDERS TABLE WITH NOTES ----------
alter table public.orders add column if not exists order_notes text;
alter table public.orders add column if not exists shipping_method text default 'standard';
