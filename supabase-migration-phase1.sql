-- ============================================================
-- D'VERO — Phase 1 Database Migration
-- Product Reviews & Wishlists
-- ============================================================

-- ---------- PRODUCT REVIEWS ----------
create table if not exists public.product_reviews (
  id bigint generated always as identity primary key,
  product_id text references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz default now()
);

create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);
create index if not exists idx_product_reviews_rating on public.product_reviews(rating);

alter table public.product_reviews enable row level security;

drop policy if exists "Public read product reviews" on public.product_reviews;
drop policy if exists "Authenticated insert product reviews" on public.product_reviews;

create policy "Public read product reviews" on public.product_reviews
  for select using (true);

create policy "Authenticated insert product reviews" on public.product_reviews
  for insert with check (auth.uid() = user_id or user_id is null);

-- ---------- WISHLISTS ----------
create table if not exists public.wishlists (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_product_id on public.wishlists(product_id);

alter table public.wishlists enable row level security;

drop policy if exists "Users read own wishlist" on public.wishlists;
drop policy if exists "Users insert own wishlist" on public.wishlists;
drop policy if exists "Users delete own wishlist" on public.wishlists;

create policy "Users read own wishlist" on public.wishlists
  for select using (auth.uid() = user_id);

create policy "Users insert own wishlist" on public.wishlists
  for insert with check (auth.uid() = user_id);

create policy "Users delete own wishlist" on public.wishlists
  for delete using (auth.uid() = user_id);
