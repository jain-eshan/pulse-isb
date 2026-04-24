-- Pulse additive migration — runs in Supabase SQL Editor
-- Safe to run on existing isb-explorer DB: only ADDs, never drops.

-- Extend users with interests + wa_phone + campus
alter table public.users add column if not exists interests text[] not null default '{}';
alter table public.users add column if not exists wa_phone text;
alter table public.users add column if not exists campus text not null default 'mohali';

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  tags text[] not null default '{}',
  wa_event_id text,
  wa_group_jid text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sessions_starts_at_idx on public.sessions (starts_at desc);

-- RSVPs
create table if not exists public.rsvps (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('going','maybe','cant')),
  responded_via text not null default 'web',
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- Pulse wishlist
create table if not exists public.pulse_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  tags text[] not null default '{}',
  status text not null default 'open' check (status in ('open','planned','done')),
  linked_session_id uuid references public.sessions(id),
  created_at timestamptz not null default now()
);
create table if not exists public.pulse_votes (
  pulse_id uuid not null references public.pulse_items(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pulse_id, user_id)
);

-- Places
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('food','cafe','nightlife','travel')),
  vibe_tags text[] not null default '{}',
  budget text not null check (budget in ('low','mid','high')),
  area text,
  description text,
  google_maps_url text,
  added_by_user_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- WhatsApp linking
create table if not exists public.wa_links (
  user_id uuid primary key references public.users(id) on delete cascade,
  wa_phone text unique,
  verified_at timestamptz,
  onetime_code_hash text,
  code_expires_at timestamptz
);
create table if not exists public.wa_groups (
  group_jid text primary key,
  name text,
  campus text,
  added_by_user_id uuid references public.users(id),
  is_whitelisted boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.bot_events (
  id uuid primary key default gen_random_uuid(),
  group_jid text,
  source_message_id text,
  parsed_session_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.pulse_items enable row level security;
alter table public.pulse_votes enable row level security;
alter table public.places enable row level security;
alter table public.wa_links enable row level security;
alter table public.wa_groups enable row level security;
alter table public.bot_events enable row level security;

create policy "sessions_select" on public.sessions for select using (true);
create policy "sessions_insert" on public.sessions for insert with check (true);
create policy "sessions_update" on public.sessions for update using (true);
create policy "sessions_delete" on public.sessions for delete using (true);

create policy "rsvps_select" on public.rsvps for select using (true);
create policy "rsvps_insert" on public.rsvps for insert with check (true);
create policy "rsvps_update" on public.rsvps for update using (true);
create policy "rsvps_delete" on public.rsvps for delete using (true);

create policy "pulse_items_select" on public.pulse_items for select using (true);
create policy "pulse_items_insert" on public.pulse_items for insert with check (true);
create policy "pulse_items_update" on public.pulse_items for update using (true);

create policy "pulse_votes_select" on public.pulse_votes for select using (true);
create policy "pulse_votes_insert" on public.pulse_votes for insert with check (true);
create policy "pulse_votes_delete" on public.pulse_votes for delete using (true);

create policy "places_select" on public.places for select using (true);
create policy "places_insert" on public.places for insert with check (true);

create policy "wa_links_select" on public.wa_links for select using (true);
create policy "wa_links_insert" on public.wa_links for insert with check (true);
create policy "wa_links_update" on public.wa_links for update using (true);

create policy "wa_groups_select" on public.wa_groups for select using (true);
create policy "wa_groups_insert" on public.wa_groups for insert with check (true);
create policy "wa_groups_update" on public.wa_groups for update using (true);

create policy "bot_events_insert" on public.bot_events for insert with check (true);
create policy "bot_events_select" on public.bot_events for select using (true);

-- Realtime
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.rsvps;
alter publication supabase_realtime add table public.pulse_items;
alter publication supabase_realtime add table public.pulse_votes;
