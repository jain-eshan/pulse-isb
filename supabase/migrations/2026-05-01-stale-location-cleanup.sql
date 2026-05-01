-- Auto-cleanup stale location rows older than 30 minutes.
-- Since we no longer delete rows on tab close (graceful staleness),
-- this cron prevents the table from accumulating ghost entries forever.
--
-- Requires pg_cron extension (enabled by default on Supabase).
-- Runs every 10 minutes.

select cron.schedule(
  'cleanup-stale-locations',
  '*/10 * * * *',
  $$DELETE FROM public.user_locations WHERE updated_at < now() - interval '30 minutes'$$
);
