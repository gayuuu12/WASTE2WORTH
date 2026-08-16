-- Storage bucket setup reference (run in Supabase SQL editor or dashboard)
-- NOT auto-applied by the app.

-- 1. Create bucket (via dashboard or API):
--    Name: listing-images
--    Public: true (for marketplace image URLs)

-- 2. Example storage policies:

-- Public read
-- create policy "Public read listing images"
-- on storage.objects for select
-- using (bucket_id = 'listing-images');

-- Authenticated upload to own company folder
-- create policy "Suppliers upload listing images"
-- on storage.objects for insert
-- to authenticated
-- with check (
--   bucket_id = 'listing-images'
--   and (storage.foldername(name))[1] in (
--     select company_id::text from profiles where id = auth.uid()
--   )
-- );

-- Authenticated delete own company files
-- create policy "Suppliers delete listing images"
-- on storage.objects for delete
-- to authenticated
-- using (
--   bucket_id = 'listing-images'
--   and (storage.foldername(name))[1] in (
--     select company_id::text from profiles where id = auth.uid()
--   )
-- );
