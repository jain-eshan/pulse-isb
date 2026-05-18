-- Persistent dedup log for the WhatsApp bot.
-- Stores a fingerprint of every event the bot has already processed
-- (regardless of whether the sender confirmed it on Pulse or not).
-- Entries expire after 7 days via the expires_at column.

create table if not exists public.bot_dedup_log (
  id            uuid primary key default gen_random_uuid(),
  event_hash    text not null,           -- SHA-256 of normalized(title + starts_at)
  title         text not null,           -- human-readable, for log inspection
  starts_at     timestamptz not null,    -- the event's start time
  first_seen_at timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '7 days')
);

-- Fast lookup by hash
create index if not exists idx_dedup_log_hash on public.bot_dedup_log (event_hash);

-- Cleanup: only the bot (service_role) accesses this table
alter table public.bot_dedup_log enable row level security;
