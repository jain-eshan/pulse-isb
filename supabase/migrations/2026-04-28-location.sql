-- user_locations: live location broadcasting table
-- Each user has at most one row (upsert by user_id)
-- Rows are deleted when location_sharing is turned off

create table if not exists public.user_locations (
  user_id     uuid primary key references public.users(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  updated_at  timestamptz not null default now()
);

alter table public.user_locations enable row level security;

-- All authenticated users can see who's on campus
drop policy if exists "loc_select" on public.user_locations;
create policy "loc_select" on public.user_locations
  for select using (auth.role() = 'authenticated');

-- Users can only write their own row
drop policy if exists "loc_upsert" on public.user_locations;
create policy "loc_upsert" on public.user_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable realtime so the heatmap updates live
alter publication supabase_realtime add table public.user_locations;
