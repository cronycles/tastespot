-- TasteSpot — Storage bucket RLS policies
-- Apply this AFTER creating the bucket manually in Supabase Dashboard:
--   Storage → New bucket → Name: "activity-photos" → Public: ON (public bucket)
--
-- For a PUBLIC bucket, anyone with the URL can read files (URLs contain UUIDs and are unguessable).
-- Write access (upload/delete) is still restricted to the file owner via RLS.

-- Allow authenticated users to upload files under their own user_id prefix
create policy "Users can upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files
create policy "Users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
