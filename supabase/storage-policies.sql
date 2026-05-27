-- Run this in the Supabase SQL editor after creating the 'trade-screenshots' bucket.
-- Set the bucket to PRIVATE (not public) in the Supabase dashboard.
--
-- Storage path convention: {user_id}/{trade_id}/{timestamp}-{filename}
-- The first path segment is always the user's UUID, which is what the
-- storage.foldername(name)[1] check enforces below.

create policy "Users can upload their own screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own screenshots"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own screenshots"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
