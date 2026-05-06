-- Storage bucket + policies for session cover images
-- This ensures the session-covers bucket exists and is publicly readable

-- Create the bucket if it doesn't exist (idempotent via insert ... on conflict)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-covers',
  'session-covers',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Allow authenticated users to upload covers
drop policy if exists "session_covers_insert" on storage.objects;
create policy "session_covers_insert" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'session-covers');

-- Allow authenticated users to update/overwrite their uploads
drop policy if exists "session_covers_update" on storage.objects;
create policy "session_covers_update" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'session-covers');

-- Allow public read access (since bucket is public)
drop policy if exists "session_covers_select" on storage.objects;
create policy "session_covers_select" on storage.objects
  for select
  to public
  using (bucket_id = 'session-covers');
