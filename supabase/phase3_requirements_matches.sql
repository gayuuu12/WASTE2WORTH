-- Waste2Worth Phase 3 — buyer requirements & matching (NON-DESTRUCTIVE reference)
-- Review and apply manually in Supabase SQL editor. Does NOT drop existing tables.

-- =============================================================================
-- buyer_requirements — add columns if missing (safe IF NOT EXISTS pattern)
-- Verified live 2026-08-16: latitude/longitude already exist; only these 5 are missing:
-- See supabase/migrations/20260816_buyer_requirements_phase3_columns.sql

ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS minimum_acceptable_quantity numeric;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS preferred_quality text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS preferred_country text;
ALTER TABLE buyer_requirements ADD COLUMN IF NOT EXISTS required_by date;

-- Expected core columns (verified live 2026-08-16):
-- id, buyer_company_id, created_by, title, category_id, material_name, desired_grade,
-- quantity_needed, quantity_unit, max_price, currency, max_distance_km,
-- preferred_city, preferred_state, latitude, longitude, recurring, notes, status,
-- created_at, updated_at
-- Phase 3 additive columns (migration required):
-- description, minimum_acceptable_quantity, preferred_quality, preferred_country, required_by

-- =============================================================================
-- matches table
-- =============================================================================

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES buyer_requirements(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES waste_listings(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  score_breakdown jsonb,
  distance_km numeric,
  status text NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'viewed', 'dismissed', 'contacted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, listing_id)
);

CREATE INDEX IF NOT EXISTS matches_requirement_id_idx ON matches (requirement_id);
CREATE INDEX IF NOT EXISTS matches_listing_id_idx ON matches (listing_id);
CREATE INDEX IF NOT EXISTS matches_score_idx ON matches (score DESC);

-- =============================================================================
-- RLS — buyer_requirements
-- =============================================================================

ALTER TABLE buyer_requirements ENABLE ROW LEVEL SECURITY;

-- Buyers manage their own requirements
DROP POLICY IF EXISTS buyer_requirements_select_own ON buyer_requirements;
CREATE POLICY buyer_requirements_select_own ON buyer_requirements
  FOR SELECT TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS buyer_requirements_insert_own ON buyer_requirements;
CREATE POLICY buyer_requirements_insert_own ON buyer_requirements
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS buyer_requirements_update_own ON buyer_requirements;
CREATE POLICY buyer_requirements_update_own ON buyer_requirements
  FOR UPDATE TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    buyer_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS buyer_requirements_delete_own ON buyer_requirements;
CREATE POLICY buyer_requirements_delete_own ON buyer_requirements
  FOR DELETE TO authenticated
  USING (
    buyer_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- RLS — matches (read-only from client; writes via server actions as authenticated user)
-- =============================================================================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matches_select_buyer ON matches;
CREATE POLICY matches_select_buyer ON matches
  FOR SELECT TO authenticated
  USING (
    requirement_id IN (
      SELECT id FROM buyer_requirements
      WHERE buyer_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS matches_select_supplier ON matches;
CREATE POLICY matches_select_supplier ON matches
  FOR SELECT TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM waste_listings
      WHERE supplier_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Allow authenticated users to upsert matches for their own requirements/listings
DROP POLICY IF EXISTS matches_insert_participant ON matches;
CREATE POLICY matches_insert_participant ON matches
  FOR INSERT TO authenticated
  WITH CHECK (
    requirement_id IN (
      SELECT id FROM buyer_requirements
      WHERE buyer_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR listing_id IN (
      SELECT id FROM waste_listings
      WHERE supplier_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS matches_update_participant ON matches;
CREATE POLICY matches_update_participant ON matches
  FOR UPDATE TO authenticated
  USING (
    requirement_id IN (
      SELECT id FROM buyer_requirements
      WHERE buyer_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR listing_id IN (
      SELECT id FROM waste_listings
      WHERE supplier_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
