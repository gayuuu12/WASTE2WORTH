-- Waste2Worth AI — listing-images storage bucket and policies
-- Run after 20260816_000000_initial_waste2worth_schema.sql on a fresh project.
-- Path convention used by lib/listings/storage.ts:
--   {company_id}/{listing_id}/{uuid}.{ext}
--   {company_id}/staging/{uuid}.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for marketplace image URLs (getListingImagePublicUrl)
DROP POLICY IF EXISTS listing_images_public_read ON storage.objects;
CREATE POLICY listing_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');

-- Authenticated upload into own company folder (including staging/)
DROP POLICY IF EXISTS listing_images_insert_own_company ON storage.objects;
CREATE POLICY listing_images_insert_own_company ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

-- Authenticated update within own company folder
DROP POLICY IF EXISTS listing_images_update_own_company ON storage.objects;
CREATE POLICY listing_images_update_own_company ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

-- Authenticated delete within own company folder
DROP POLICY IF EXISTS listing_images_delete_own_company ON storage.objects;
CREATE POLICY listing_images_delete_own_company ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );
