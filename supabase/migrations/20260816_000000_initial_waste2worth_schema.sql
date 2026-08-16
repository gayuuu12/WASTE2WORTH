-- Waste2Worth AI — initial bootstrap schema
-- For a completely empty Supabase project. Safe to run once on fresh install.
-- Does NOT drop existing objects. Does NOT insert operational/mock business data.
--
-- Dependency order within this file:
--   1. extensions
--   2. set_updated_at() helper (no table references)
--   3. all tables
--   4. current_user_company_id() (requires profiles)
--   5. indexes
--   6. triggers
--   7. enable RLS
--   8. RLS policies (require tables + current_user_company_id)
--
-- Fresh install execution order:
--   1. this file
--   2. 20260816_000001_listing_images_storage.sql
--   3. 20260816_000002_seed_waste_categories.sql

-- =============================================================================
-- 1. Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 2. Trigger helper (no table dependencies)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. Tables
-- =============================================================================

-- companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  industry text,
  business_type text,
  role text NOT NULL DEFAULT 'both'
    CHECK (role IN ('supplier', 'buyer', 'both')),
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  logo_url text,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_doc_path text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  company_id uuid REFERENCES public.companies (id) ON DELETE SET NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- waste_categories
CREATE TABLE IF NOT EXISTS public.waste_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- waste_listings
CREATE TABLE IF NOT EXISTS public.waste_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.waste_categories (id) ON DELETE SET NULL,
  material_name text NOT NULL,
  material_grade text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  quantity_unit text NOT NULL,
  minimum_order_quantity numeric CHECK (minimum_order_quantity IS NULL OR minimum_order_quantity > 0),
  condition text,
  contamination_level text,
  moisture_level text,
  quality_notes text,
  asking_price numeric CHECK (asking_price IS NULL OR asking_price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  price_unit text,
  negotiable boolean NOT NULL DEFAULT false,
  recurring boolean NOT NULL DEFAULT false,
  availability_frequency text,
  available_from date,
  location_text text,
  city text,
  state text,
  country text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'reserved', 'sold', 'inactive', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- listing_images
CREATE TABLE IF NOT EXISTS public.listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.waste_listings (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- buyer_requirements (full Phase 3 schema)
CREATE TABLE IF NOT EXISTS public.buyer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.waste_categories (id) ON DELETE SET NULL,
  material_name text NOT NULL,
  desired_grade text,
  quantity_needed numeric CHECK (quantity_needed IS NULL OR quantity_needed > 0),
  minimum_acceptable_quantity numeric
    CHECK (minimum_acceptable_quantity IS NULL OR minimum_acceptable_quantity > 0),
  quantity_unit text NOT NULL,
  max_price numeric CHECK (max_price IS NULL OR max_price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  preferred_quality text,
  max_distance_km numeric CHECK (max_distance_km IS NULL OR max_distance_km > 0),
  preferred_city text,
  preferred_state text,
  preferred_country text,
  latitude double precision,
  longitude double precision,
  recurring boolean NOT NULL DEFAULT false,
  required_by date,
  notes text,
  status text NOT NULL DEFAULT 'paused'
    CHECK (status IN ('active', 'fulfilled', 'paused', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- matches (score + score_breakdown jsonb — matches lib/matching/engine.ts)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES public.buyer_requirements (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.waste_listings (id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  score_breakdown jsonb,
  distance_km numeric,
  status text NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'viewed', 'dismissed', 'contacted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, listing_id)
);

-- offers (future phase — derived from lib/types.ts)
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.waste_listings (id) ON DELETE CASCADE,
  buyer_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  supplier_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  offered_price numeric NOT NULL CHECK (offered_price >= 0),
  quantity numeric NOT NULL CHECK (quantity > 0),
  quantity_unit text NOT NULL,
  currency text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'expired')),
  parent_offer_id uuid REFERENCES public.offers (id) ON DELETE SET NULL,
  is_counter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- transactions (dashboard count query + lib/types.ts)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.offers (id) ON DELETE SET NULL,
  listing_id uuid NOT NULL REFERENCES public.waste_listings (id) ON DELETE RESTRICT,
  buyer_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  supplier_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  material_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  quantity_unit text NOT NULL,
  agreed_price numeric NOT NULL CHECK (agreed_price >= 0),
  currency text NOT NULL,
  total_value numeric NOT NULL CHECK (total_value >= 0),
  status text NOT NULL DEFAULT 'agreed'
    CHECK (status IN ('agreed', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed')),
  co2_saved_kg numeric CHECK (co2_saved_kg IS NULL OR co2_saved_kg >= 0),
  waste_diverted_kg numeric CHECK (waste_diverted_kg IS NULL OR waste_diverted_kg >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- conversations (future phase — lib/types.ts)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.waste_listings (id) ON DELETE SET NULL,
  buyer_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  supplier_company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- messages (future phase — lib/types.ts)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sender_company_id uuid REFERENCES public.companies (id) ON DELETE SET NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- notifications (future phase — lib/types.ts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. RLS helper (requires profiles)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =============================================================================
-- 5. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS companies_created_by_idx ON public.companies (created_by);
CREATE INDEX IF NOT EXISTS companies_role_idx ON public.companies (role);

CREATE INDEX IF NOT EXISTS profiles_company_id_idx ON public.profiles (company_id);

CREATE INDEX IF NOT EXISTS waste_categories_name_idx ON public.waste_categories (name);

CREATE INDEX IF NOT EXISTS waste_listings_supplier_company_id_idx
  ON public.waste_listings (supplier_company_id);
CREATE INDEX IF NOT EXISTS waste_listings_status_idx ON public.waste_listings (status);
CREATE INDEX IF NOT EXISTS waste_listings_category_id_idx ON public.waste_listings (category_id);
CREATE INDEX IF NOT EXISTS waste_listings_created_at_idx ON public.waste_listings (created_at DESC);

CREATE INDEX IF NOT EXISTS listing_images_listing_id_idx ON public.listing_images (listing_id);

CREATE INDEX IF NOT EXISTS buyer_requirements_buyer_company_id_idx
  ON public.buyer_requirements (buyer_company_id);
CREATE INDEX IF NOT EXISTS buyer_requirements_status_idx ON public.buyer_requirements (status);
CREATE INDEX IF NOT EXISTS buyer_requirements_category_id_idx
  ON public.buyer_requirements (category_id);

CREATE INDEX IF NOT EXISTS matches_requirement_id_idx ON public.matches (requirement_id);
CREATE INDEX IF NOT EXISTS matches_listing_id_idx ON public.matches (listing_id);
CREATE INDEX IF NOT EXISTS matches_score_idx ON public.matches (score DESC);

CREATE INDEX IF NOT EXISTS offers_listing_id_idx ON public.offers (listing_id);
CREATE INDEX IF NOT EXISTS offers_buyer_company_id_idx ON public.offers (buyer_company_id);
CREATE INDEX IF NOT EXISTS offers_supplier_company_id_idx ON public.offers (supplier_company_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON public.offers (status);

CREATE INDEX IF NOT EXISTS transactions_buyer_company_id_idx
  ON public.transactions (buyer_company_id);
CREATE INDEX IF NOT EXISTS transactions_supplier_company_id_idx
  ON public.transactions (supplier_company_id);
CREATE INDEX IF NOT EXISTS transactions_listing_id_idx ON public.transactions (listing_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions (status);

CREATE INDEX IF NOT EXISTS conversations_buyer_company_id_idx
  ON public.conversations (buyer_company_id);
CREATE INDEX IF NOT EXISTS conversations_supplier_company_id_idx
  ON public.conversations (supplier_company_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON public.conversations (listing_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx
  ON public.conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON public.notifications (read_at);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

-- =============================================================================
-- 6. Triggers
-- =============================================================================

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS waste_listings_set_updated_at ON public.waste_listings;
CREATE TRIGGER waste_listings_set_updated_at
  BEFORE UPDATE ON public.waste_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS buyer_requirements_set_updated_at ON public.buyer_requirements;
CREATE TRIGGER buyer_requirements_set_updated_at
  BEFORE UPDATE ON public.buyer_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;
CREATE TRIGGER matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS offers_set_updated_at ON public.offers;
CREATE TRIGGER offers_set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. Enable Row Level Security
-- =============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. RLS policies
-- =============================================================================

-- companies
DROP POLICY IF EXISTS companies_select_member ON public.companies;
CREATE POLICY companies_select_member ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.current_user_company_id());

DROP POLICY IF EXISTS companies_select_marketplace ON public.companies;
CREATE POLICY companies_select_marketplace ON public.companies
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.waste_listings wl
      WHERE wl.supplier_company_id = companies.id
        AND wl.status = 'active'
    )
  );

DROP POLICY IF EXISTS companies_insert_own ON public.companies;
CREATE POLICY companies_insert_own ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS companies_update_member ON public.companies;
CREATE POLICY companies_update_member ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.current_user_company_id())
  WITH CHECK (id = public.current_user_company_id());

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- waste_categories
DROP POLICY IF EXISTS waste_categories_select_all ON public.waste_categories;
CREATE POLICY waste_categories_select_all ON public.waste_categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS waste_categories_insert_authenticated ON public.waste_categories;
CREATE POLICY waste_categories_insert_authenticated ON public.waste_categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS waste_categories_update_authenticated ON public.waste_categories;
CREATE POLICY waste_categories_update_authenticated ON public.waste_categories
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- waste_listings
DROP POLICY IF EXISTS waste_listings_select_active ON public.waste_listings;
CREATE POLICY waste_listings_select_active ON public.waste_listings
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS waste_listings_select_own ON public.waste_listings;
CREATE POLICY waste_listings_select_own ON public.waste_listings
  FOR SELECT TO authenticated
  USING (supplier_company_id = public.current_user_company_id());

DROP POLICY IF EXISTS waste_listings_insert_supplier ON public.waste_listings;
CREATE POLICY waste_listings_insert_supplier ON public.waste_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    supplier_company_id = public.current_user_company_id()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS waste_listings_update_own ON public.waste_listings;
CREATE POLICY waste_listings_update_own ON public.waste_listings
  FOR UPDATE TO authenticated
  USING (supplier_company_id = public.current_user_company_id())
  WITH CHECK (supplier_company_id = public.current_user_company_id());

DROP POLICY IF EXISTS waste_listings_delete_own ON public.waste_listings;
CREATE POLICY waste_listings_delete_own ON public.waste_listings
  FOR DELETE TO authenticated
  USING (supplier_company_id = public.current_user_company_id());

-- listing_images
DROP POLICY IF EXISTS listing_images_select_visible ON public.listing_images;
CREATE POLICY listing_images_select_visible ON public.listing_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.waste_listings wl
      WHERE wl.id = listing_images.listing_id
        AND (
          wl.status = 'active'
          OR wl.supplier_company_id = public.current_user_company_id()
        )
    )
  );

DROP POLICY IF EXISTS listing_images_insert_own_listing ON public.listing_images;
CREATE POLICY listing_images_insert_own_listing ON public.listing_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.waste_listings wl
      WHERE wl.id = listing_images.listing_id
        AND wl.supplier_company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS listing_images_delete_own_listing ON public.listing_images;
CREATE POLICY listing_images_delete_own_listing ON public.listing_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.waste_listings wl
      WHERE wl.id = listing_images.listing_id
        AND wl.supplier_company_id = public.current_user_company_id()
    )
  );

-- buyer_requirements
DROP POLICY IF EXISTS buyer_requirements_select_own ON public.buyer_requirements;
CREATE POLICY buyer_requirements_select_own ON public.buyer_requirements
  FOR SELECT TO authenticated
  USING (buyer_company_id = public.current_user_company_id());

DROP POLICY IF EXISTS buyer_requirements_select_active ON public.buyer_requirements;
CREATE POLICY buyer_requirements_select_active ON public.buyer_requirements
  FOR SELECT TO authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS buyer_requirements_insert_own ON public.buyer_requirements;
CREATE POLICY buyer_requirements_insert_own ON public.buyer_requirements
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS buyer_requirements_update_own ON public.buyer_requirements;
CREATE POLICY buyer_requirements_update_own ON public.buyer_requirements
  FOR UPDATE TO authenticated
  USING (buyer_company_id = public.current_user_company_id())
  WITH CHECK (buyer_company_id = public.current_user_company_id());

DROP POLICY IF EXISTS buyer_requirements_delete_own ON public.buyer_requirements;
CREATE POLICY buyer_requirements_delete_own ON public.buyer_requirements
  FOR DELETE TO authenticated
  USING (buyer_company_id = public.current_user_company_id());

-- matches
DROP POLICY IF EXISTS matches_select_buyer ON public.matches;
CREATE POLICY matches_select_buyer ON public.matches
  FOR SELECT TO authenticated
  USING (
    requirement_id IN (
      SELECT id FROM public.buyer_requirements
      WHERE buyer_company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS matches_select_supplier ON public.matches;
CREATE POLICY matches_select_supplier ON public.matches
  FOR SELECT TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM public.waste_listings
      WHERE supplier_company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS matches_insert_participant ON public.matches;
CREATE POLICY matches_insert_participant ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (
    requirement_id IN (
      SELECT id FROM public.buyer_requirements
      WHERE buyer_company_id = public.current_user_company_id()
    )
    OR listing_id IN (
      SELECT id FROM public.waste_listings
      WHERE supplier_company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS matches_update_participant ON public.matches;
CREATE POLICY matches_update_participant ON public.matches
  FOR UPDATE TO authenticated
  USING (
    requirement_id IN (
      SELECT id FROM public.buyer_requirements
      WHERE buyer_company_id = public.current_user_company_id()
    )
    OR listing_id IN (
      SELECT id FROM public.waste_listings
      WHERE supplier_company_id = public.current_user_company_id()
    )
  )
  WITH CHECK (
    requirement_id IN (
      SELECT id FROM public.buyer_requirements
      WHERE buyer_company_id = public.current_user_company_id()
    )
    OR listing_id IN (
      SELECT id FROM public.waste_listings
      WHERE supplier_company_id = public.current_user_company_id()
    )
  );

DROP POLICY IF EXISTS matches_delete_participant ON public.matches;
CREATE POLICY matches_delete_participant ON public.matches
  FOR DELETE TO authenticated
  USING (
    requirement_id IN (
      SELECT id FROM public.buyer_requirements
      WHERE buyer_company_id = public.current_user_company_id()
    )
    OR listing_id IN (
      SELECT id FROM public.waste_listings
      WHERE supplier_company_id = public.current_user_company_id()
    )
  );

-- offers
DROP POLICY IF EXISTS offers_select_participant ON public.offers;
CREATE POLICY offers_select_participant ON public.offers
  FOR SELECT TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS offers_insert_buyer ON public.offers;
CREATE POLICY offers_insert_buyer ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS offers_update_participant ON public.offers;
CREATE POLICY offers_update_participant ON public.offers
  FOR UPDATE TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  )
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

-- transactions
DROP POLICY IF EXISTS transactions_select_participant ON public.transactions;
CREATE POLICY transactions_select_participant ON public.transactions
  FOR SELECT TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS transactions_insert_participant ON public.transactions;
CREATE POLICY transactions_insert_participant ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS transactions_update_participant ON public.transactions;
CREATE POLICY transactions_update_participant ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  )
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

-- conversations
DROP POLICY IF EXISTS conversations_select_participant ON public.conversations;
CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS conversations_insert_participant ON public.conversations;
CREATE POLICY conversations_insert_participant ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS conversations_update_participant ON public.conversations;
CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  )
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

-- messages
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
CREATE POLICY messages_select_participant ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.buyer_company_id = public.current_user_company_id()
          OR c.supplier_company_id = public.current_user_company_id()
        )
    )
  );

DROP POLICY IF EXISTS messages_insert_participant ON public.messages;
CREATE POLICY messages_insert_participant ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.buyer_company_id = public.current_user_company_id()
          OR c.supplier_company_id = public.current_user_company_id()
        )
    )
  );

DROP POLICY IF EXISTS messages_update_own ON public.messages;
CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
