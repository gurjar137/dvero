-- ============================================================
-- D'VERO — Dynamic Contact Us & Messages Supabase Migration
-- Includes: contact_settings table, contact_messages table,
-- RLS policies, default settings seed, and schema cache reload.
-- ============================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. CONTACT SETTINGS TABLE
create table if not exists public.contact_settings (
  id text primary key default 'default',
  brand_name text not null default 'D''VERO',
  email text not null default 'hello@dvero.in',
  phone text not null default '+91 98765 43210',
  whatsapp text not null default '+91 98765 43210',
  address text not null default 'Jaipur, Rajasthan, India',
  google_maps_url text default 'https://maps.google.com',
  hours_monday text not null default '10:00 AM – 7:00 PM',
  hours_tuesday text not null default '10:00 AM – 7:00 PM',
  hours_wednesday text not null default '10:00 AM – 7:00 PM',
  hours_thursday text not null default '10:00 AM – 7:00 PM',
  hours_friday text not null default '10:00 AM – 7:00 PM',
  hours_saturday text not null default '10:00 AM – 5:00 PM',
  hours_sunday text not null default 'Closed',
  instagram_url text default 'https://instagram.com/dvero.in',
  facebook_url text default 'https://facebook.com/dvero.in',
  youtube_url text default 'https://youtube.com/@dvero.official',
  page_heading text not null default 'Get in Touch',
  page_description text not null default 'Have a question about your order or D’VERO? We’re here to help.',
  updated_at timestamptz default now()
);

-- Enable RLS on contact_settings
alter table public.contact_settings enable row level security;

-- RLS Policies for contact_settings
drop policy if exists "Public read contact_settings" on public.contact_settings;
create policy "Public read contact_settings" on public.contact_settings
  for select using (true);

drop policy if exists "Admin manage contact_settings" on public.contact_settings;
create policy "Admin manage contact_settings" on public.contact_settings
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );

-- Seed default initial row in contact_settings if empty
insert into public.contact_settings (
  id, brand_name, email, phone, whatsapp, address, google_maps_url,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday, hours_saturday, hours_sunday,
  instagram_url, facebook_url, youtube_url, page_heading, page_description
)
values (
  'default', 'D''VERO', 'hello@dvero.in', '+91 98765 43210', '+91 98765 43210', 'Jaipur, Rajasthan, India', 'https://maps.google.com',
  '10:00 AM – 7:00 PM', '10:00 AM – 7:00 PM', '10:00 AM – 7:00 PM', '10:00 AM – 7:00 PM', '10:00 AM – 7:00 PM', '10:00 AM – 5:00 PM', 'Closed',
  'https://instagram.com/dvero.in', 'https://facebook.com/dvero.in', 'https://youtube.com/@dvero.official', 'Get in Touch', 'Have a question about your order or D’VERO? We’re here to help.'
)
on conflict (id) do nothing;


-- 2. CONTACT MESSAGES TABLE
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz default now()
);

-- Index for ordering by creation date
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);

-- Enable RLS on contact_messages
alter table public.contact_messages enable row level security;

-- RLS Policies for contact_messages
drop policy if exists "Public insert contact_messages" on public.contact_messages;
create policy "Public insert contact_messages" on public.contact_messages
  for insert with check (true);

drop policy if exists "Admin read contact_messages" on public.contact_messages;
create policy "Admin read contact_messages" on public.contact_messages
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );

drop policy if exists "Admin update contact_messages" on public.contact_messages;
create policy "Admin update contact_messages" on public.contact_messages
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );

drop policy if exists "Admin delete contact_messages" on public.contact_messages;
create policy "Admin delete contact_messages" on public.contact_messages
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
