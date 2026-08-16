-- Safe additive migration: buyer_requirements Phase 3 columns
-- Verified against live Supabase project on 2026-08-16.
-- Does NOT drop columns, tables, or data.
--
-- Live table already has:
--   id, buyer_company_id, created_by, title, category_id, material_name, desired_grade,
--   quantity_needed, quantity_unit, max_price, currency, max_distance_km,
--   preferred_city, preferred_state, latitude, longitude, recurring, notes, status,
--   created_at, updated_at
--
-- Missing columns required by the application (lib/actions/requirements.ts):
--   description, minimum_acceptable_quantity, preferred_quality, preferred_country, required_by
--
-- Apply in Supabase Dashboard → SQL Editor, then re-run:
--   node --env-file=.env.local scripts/verify-buyer-requirements-schema.mjs

ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS minimum_acceptable_quantity numeric;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS preferred_quality text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS preferred_country text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS required_by date;
