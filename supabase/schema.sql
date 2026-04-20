-- ISB Explorer — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com > SQL Editor)

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  microsoft_id text unique not null,
  name text not null,
  email text unique not null,
  section text not null default '',
  cohort_year integer not null default extract(year from now())::integer,
  vibe_tags text[] not null default '{}',
  budget_min integer not null default 500,
  budget_max integer not null default 3000,
  location_sharing boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Going table (I'm Going broadcasts)
create table if not exists public.going (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  place_id text not null,
  going_at timestamptz not null,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- User locations table (Snapchat Map)
create table if not exists public.user_locations (
  user_id uuid primary key references public.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

-- Enable Realtime for live updates
alter publication supabase_realtime add table public.going;
alter publication supabase_realtime add table public.user_locations;

-- Row Level Security
alter table public.users enable row level security;
alter table public.going enable row level security;
alter table public.user_locations enable row level security;

-- Users: anyone authenticated can read, only owner can update
create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (true);
create policy "users_update" on public.users for update using (true);

-- Going: anyone authenticated can read all, insert own, delete own
create policy "going_select" on public.going for select using (true);
create policy "going_insert" on public.going for insert with check (true);
create policy "going_update" on public.going for update using (true);
create policy "going_delete" on public.going for delete using (true);

-- User locations: anyone can read (for heatmap density), owner can upsert/delete
create policy "locations_select" on public.user_locations for select using (true);
create policy "locations_upsert" on public.user_locations for insert with check (true);
create policy "locations_update" on public.user_locations for update using (true);
create policy "locations_delete" on public.user_locations for delete using (true);

-- Auto-deactivate going entries older than 48 hours (run as a cron or manually)
-- create extension if not exists pg_cron;
-- select cron.schedule('deactivate-old-goings', '0 * * * *',
--   $$update public.going set is_active = false where going_at < now() - interval '48 hours' and is_active = true$$
-- );
