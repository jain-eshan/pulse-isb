-- Luma UI Redesign v3 — schema additions
-- Run this in Supabase SQL Editor or via supabase db push

-- 1. Sessions: add category, subcategory, and cover image support
alter table public.sessions
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists cover_image_url text;

-- 2. Places: add image, rating, and review fields
alter table public.places
  add column if not exists image_url text,
  add column if not exists google_rating numeric(2,1),
  add column if not exists review_count integer default 0,
  add column if not exists distance_from_campus text;

-- 3. Place reviews — ISB user reviews on Discover places
create table if not exists public.place_reviews (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique(place_id, user_id) -- one review per user per place
);

alter table public.place_reviews enable row level security;

-- Everyone can read reviews
drop policy if exists "reviews_select" on public.place_reviews;
create policy "reviews_select" on public.place_reviews
  for select using (auth.role() = 'authenticated');

-- Users can create/update their own reviews
drop policy if exists "reviews_upsert" on public.place_reviews;
create policy "reviews_upsert" on public.place_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Storage bucket for session cover images
-- Note: Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: session-covers
-- Public: true
-- File size limit: 5MB
-- Allowed mime types: image/jpeg, image/png, image/webp, image/gif
