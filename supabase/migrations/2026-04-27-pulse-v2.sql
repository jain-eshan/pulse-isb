-- Pulse v2 schema additions
-- Run in Supabase SQL Editor

-- Section + OGSG + location_sharing on users
alter table public.users add column if not exists ogsg int check (ogsg between 1 and 12);
alter table public.users add column if not exists location_sharing boolean not null default false;
alter table public.users add column if not exists vibe_friday text;
alter table public.users add column if not exists chaotic_thing text;
alter table public.users add column if not exists onboarded_at timestamptz;

-- Visibility tags on sessions
alter table public.sessions add column if not exists visible_to_sections text[] not null default '{}';
alter table public.sessions add column if not exists visible_to_ogsgs text[] not null default '{}';

-- Bot pitch tracking — never DM the same unlinked user twice
create table if not exists public.bot_dm_pitches (
  jid               text primary key,
  first_pitched_at  timestamptz not null default now(),
  source_group_jid  text,
  parsed_text       text
);
alter table public.bot_dm_pitches enable row level security;
drop policy if exists "bot_dm_pitches_all" on public.bot_dm_pitches;
create policy "bot_dm_pitches_all" on public.bot_dm_pitches for all using (true) with check (true);

-- Pending bot confirmations (replaces in-memory map)
create table if not exists public.bot_pending_confirms (
  sender_jid        text primary key,
  group_jid         text not null,
  source_text       text not null,
  parsed_payload    jsonb,
  expires_at        timestamptz not null default now() + interval '5 minutes'
);
alter table public.bot_pending_confirms enable row level security;
drop policy if exists "bot_pending_confirms_all" on public.bot_pending_confirms;
create policy "bot_pending_confirms_all" on public.bot_pending_confirms for all using (true) with check (true);

-- Cleanup test sessions
delete from public.sessions
where title ilike '%sukhna%' or title = 'Test Session';
