# D'Vero — Next.js + Tailwind + Supabase

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` (already pre-filled with the project's Supabase URL/key — replace if using a different project).
3. Run `supabase-schema.sql` in your Supabase SQL Editor (idempotent — safe to re-run).
4. In Supabase: Storage → create bucket `product-images` (Public ON).
5. In Supabase: Authentication → Users → Add User → copy the UID, then in SQL Editor:
   ```sql
   insert into profiles (id, full_name, role) values ('paste-uid-here', 'Your Name', 'admin');
   ```
6. `npm run dev` — storefront at `/`, admin panel at `/admin`.

## Structure

- `app/` — storefront routes (home, category, product, about, contact, login, profile, bag, checkout, confirmation)
- `app/admin/` — admin panel routes (dashboard, products, inventory, orders, settings, users, profile), guarded by `AdminAuthProvider`
- `components/` — shared UI (Header, Footer, Hero, ProductCard, FitSlider, CartContext, AuthContext)
- `components/admin/` — admin-only UI (sidebar, product modal, toast, admin auth)
- `lib/` — Supabase client, types, hooks (`useProducts`, `useSettings`, `useAdminData`), utils

## Notes

- Cart is stored in `localStorage` client-side; orders, products, inventory, settings, and profiles are all in Supabase.
- Realtime: storefront and admin both subscribe to Postgres changes on `products`, `inventory`, `settings`, and `orders`, so admin edits appear live without a refresh.
- Image uploads go to the `product-images` Supabase Storage bucket.
