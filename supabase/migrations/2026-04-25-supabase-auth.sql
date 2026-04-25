-- Migration: Switch to Supabase Auth
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to run on a fresh project. Drops and recreates all tables.

-- ─── Drop everything in dependency order ────────────────────────────────────
drop table if exists public.bot_events cascade;
drop table if exists public.wa_groups cascade;
drop table if exists public.wa_links cascade;
drop table if exists public.places cascade;
drop table if exists public.pulse_votes cascade;
drop table if exists public.pulse_items cascade;
drop table if exists public.rsvps cascade;
drop table if exists public.sessions cascade;
drop table if exists public.users cascade;
drop function if exists public.handle_new_user cascade;

-- ─── Users (linked to Supabase auth.users) ──────────────────────────────────
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  email         text not null,
  section       text not null default '',
  cohort_year   int  not null default 2027,
  campus        text not null default 'mohali' check (campus in ('mohali','hyderabad')),
  interests     text[] not null default '{}',
  wa_phone      text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Auto-create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Sessions ────────────────────────────────────────────────────────────────
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.users(id) on delete cascade,
  title         text not null,
  description   text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  venue         text,
  tags          text[] not null default '{}',
  wa_event_id   text,
  wa_group_jid  text,
  archived      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index sessions_starts_at_idx on public.sessions (starts_at desc);

-- ─── RSVPs ───────────────────────────────────────────────────────────────────
create table public.rsvps (
  session_id    uuid not null references public.sessions(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  status        text not null check (status in ('going','maybe','cant')),
  responded_via text not null default 'web',
  created_at    timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- ─── Pulse wishlist ───────────────────────────────────────────────────────────
create table public.pulse_items (
  id                 uuid primary key default gen_random_uuid(),
  creator_id         uuid not null references public.users(id) on delete cascade,
  title              text not null,
  description        text,
  tags               text[] not null default '{}',
  status             text not null default 'open' check (status in ('open','planned','done')),
  linked_session_id  uuid references public.sessions(id),
  created_at         timestamptz not null default now()
);
create table public.pulse_votes (
  pulse_id    uuid not null references public.pulse_items(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (pulse_id, user_id)
);

-- ─── Places ──────────────────────────────────────────────────────────────────
create table public.places (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text not null check (category in ('food','cafe','nightlife','travel')),
  vibe_tags           text[] not null default '{}',
  budget              text not null check (budget in ('low','mid','high')),
  area                text,
  description         text,
  google_maps_url     text,
  added_by_user_id    uuid references public.users(id),
  created_at          timestamptz not null default now()
);

-- ─── WhatsApp linking ─────────────────────────────────────────────────────────
create table public.wa_links (
  user_id           uuid primary key references public.users(id) on delete cascade,
  wa_phone          text unique,
  verified_at       timestamptz,
  onetime_code_hash text,
  code_expires_at   timestamptz
);
create table public.wa_groups (
  group_jid         text primary key,
  name              text,
  campus            text,
  added_by_user_id  uuid references public.users(id),
  is_whitelisted    boolean not null default false,
  created_at        timestamptz not null default now()
);
create table public.bot_events (
  id                uuid primary key default gen_random_uuid(),
  group_jid         text,
  source_message_id text,
  parsed_session_id uuid,
  action            text not null,
  payload           jsonb,
  created_at        timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.users       enable row level security;
alter table public.sessions    enable row level security;
alter table public.rsvps       enable row level security;
alter table public.pulse_items enable row level security;
alter table public.pulse_votes enable row level security;
alter table public.places      enable row level security;
alter table public.wa_links    enable row level security;
alter table public.wa_groups   enable row level security;
alter table public.bot_events  enable row level security;

-- Users: anyone can read; only you can update your own row
create policy "users_select"    on public.users for select using (true);
create policy "users_insert"    on public.users for insert with check (auth.uid() = id);
create policy "users_update"    on public.users for update using (auth.uid() = id);

-- Sessions: all authenticated users can read/create; creator can update/delete
create policy "sessions_select" on public.sessions for select using (true);
create policy "sessions_insert" on public.sessions for insert with check (auth.uid() = creator_id);
create policy "sessions_update" on public.sessions for update using (auth.uid() = creator_id);
create policy "sessions_delete" on public.sessions for delete using (auth.uid() = creator_id);

-- RSVPs
create policy "rsvps_select"   on public.rsvps for select using (true);
create policy "rsvps_insert"   on public.rsvps for insert with check (auth.uid() = user_id);
create policy "rsvps_update"   on public.rsvps for update using (auth.uid() = user_id);
create policy "rsvps_delete"   on public.rsvps for delete using (auth.uid() = user_id);

-- Pulse items + votes
create policy "pulse_items_select" on public.pulse_items for select using (true);
create policy "pulse_items_insert" on public.pulse_items for insert with check (auth.uid() = creator_id);
create policy "pulse_items_update" on public.pulse_items for update using (auth.uid() = creator_id);
create policy "pulse_votes_select" on public.pulse_votes for select using (true);
create policy "pulse_votes_insert" on public.pulse_votes for insert with check (auth.uid() = user_id);
create policy "pulse_votes_delete" on public.pulse_votes for delete using (auth.uid() = user_id);

-- Places (anyone authenticated can read + suggest)
create policy "places_select"  on public.places for select using (true);
create policy "places_insert"  on public.places for insert with check (auth.uid() is not null);

-- WA tables (open for bot service-role writes; reads gated to owner)
create policy "wa_links_select" on public.wa_links for select using (auth.uid() = user_id);
create policy "wa_links_all"    on public.wa_links for all using (true) with check (true);
create policy "wa_groups_select" on public.wa_groups for select using (true);
create policy "wa_groups_all"    on public.wa_groups for all using (true) with check (true);
create policy "bot_events_all"   on public.bot_events for all using (true) with check (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.rsvps;
alter publication supabase_realtime add table public.pulse_items;
alter publication supabase_realtime add table public.pulse_votes;
