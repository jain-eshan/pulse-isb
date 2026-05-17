-- Bot event drafts table for magic link flow
-- When Pulse Bot detects an event from an unlinked user, it stores a draft here
-- and DMs the user a link: pulse-isb.vercel.app/?draft=<token>
-- The web app reads the token, pre-fills SessionNew, and clears the draft on publish.

create table if not exists public.bot_event_drafts (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null,
  sender_jid  text not null,
  parsed_payload jsonb not null default '{}',
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Index for fast token lookups
create index if not exists bot_event_drafts_token_idx on public.bot_event_drafts (token);

-- Auto-delete expired drafts older than 1 day (cleanup via pg cron or manual)
-- Row-level security: allow service role only (bot uses service role)
alter table public.bot_event_drafts enable row level security;

-- Web app (anon/authenticated) can read a draft by token (for pre-fill)
create policy "Anyone can read draft by token"
  on public.bot_event_drafts
  for select
  using (expires_at > now() and consumed_at is null);

-- Web app (authenticated) can mark draft as consumed
create policy "Authenticated users can consume draft"
  on public.bot_event_drafts
  for update
  using (auth.role() = 'authenticated')
  with check (true);
