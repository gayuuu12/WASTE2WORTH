-- Waste2Worth schema reference (NOT auto-applied)
-- Verify against your existing Supabase project before applying anything.

-- waste_categories: id, slug (unique), name, description, created_at
-- waste_listings: see lib/types.ts WasteListing interface
-- listing_images: id, listing_id (FK), storage_path, image_url, created_at
-- buyer_requirements (verified live 2026-08-16):
-- Present: id, buyer_company_id, created_by, title, category_id, material_name, desired_grade,
--   quantity_needed, quantity_unit, max_price, currency, max_distance_km, preferred_city,
--   preferred_state, latitude, longitude, recurring, notes, status, created_at, updated_at
-- Add via migration: description, minimum_acceptable_quantity, preferred_quality,
--   preferred_country, required_by
-- See lib/database.types.ts and supabase/migrations/20260816_buyer_requirements_phase3_columns.sql
-- matches: id, requirement_id, listing_id, score, score_breakdown, distance_km, status, created_at, updated_at
--   UNIQUE (requirement_id, listing_id) required for upsert

-- Phase 3 migration reference: supabase/phase3_requirements_matches.sql

-- Storage bucket: listing-images (public read recommended for marketplace images)
-- Object path pattern: {company_id}/{listing_id}/{uuid}.{ext}

-- Example category seed (reference data only):
-- See supabase/seed_waste_categories.sql

-- RLS recommendations:
-- waste_categories: SELECT for anon + authenticated; INSERT/UPDATE for authenticated if app seeding is allowed
-- waste_listings:
--   SELECT active listings for anon/authenticated (marketplace)
--   SELECT own company listings for authenticated supplier
--   INSERT/UPDATE/DELETE where supplier_company_id matches user's company via profiles.company_id
-- listing_images:
--   SELECT when parent listing is visible
--   INSERT/DELETE when user owns parent listing
-- buyer_requirements:
--   SELECT/INSERT/UPDATE/DELETE where buyer_company_id matches user's company via profiles.company_id
-- matches:
--   SELECT for buyers (own requirements) and suppliers (own listings)
--   INSERT/UPDATE for participants (server-side match generation only)

-- Storage policies (listing-images bucket):
-- SELECT: public (or authenticated) for marketplace image display
-- INSERT/UPDATE/DELETE: authenticated users where path starts with their company_id
