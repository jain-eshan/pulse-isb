-- Persistent WhatsApp session storage for Pulse Bot.
-- Baileys auth state (creds + signal keys) is stored here so Railway
-- container restarts don't require re-scanning the QR code.

create table if not exists public.bot_auth_state (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz not null default now()
);

-- Only the service role (bot) can read/write this table.
-- No public access — these are cryptographic session keys.
alter table public.bot_auth_state enable row level security;

-- No RLS policies = only service_role can access (default Supabase behaviour).
-- The bot uses SUPABASE_SERVICE_ROLE_KEY, so it bypasses RLS entirely.
