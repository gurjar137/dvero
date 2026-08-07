-- ============================================================
-- D'VERO — Fit Profiles Table Migration (Full Schema)
-- Run this script in Supabase SQL Editor
-- ============================================================

create table if not exists fit_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric not null,
  weight_kg numeric not null,
  age numeric not null default 28,
  gender text not null default 'male',
  body_type text not null check (body_type in ('slim', 'regular', 'athletic', 'heavy')),
  chest numeric,
  shoulder numeric,
  neck numeric,
  current_waist numeric,
  current_trouser_length numeric,
  hip numeric,
  preferred_rise text check (preferred_rise in ('low', 'mid', 'high')),
  fit_preference text check (fit_preference in ('extra_slim', 'slim', 'tailored', 'regular', 'relaxed')),
  current_fit_feedback text check (current_fit_feedback in ('too_tight', 'perfect', 'too_loose')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table fit_profiles enable row level security;

-- Policies
drop policy if exists "Users view own fit profile" on fit_profiles;
drop policy if exists "Users insert own fit profile" on fit_profiles;
drop policy if exists "Users update own fit profile" on fit_profiles;

create policy "Users view own fit profile" on fit_profiles
  for select using (auth.uid() = user_id);

create policy "Users insert own fit profile" on fit_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users update own fit profile" on fit_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
