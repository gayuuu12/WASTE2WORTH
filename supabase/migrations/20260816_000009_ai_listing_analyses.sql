-- Phase 6A: optional AI listing analysis history (run manually in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS public.ai_listing_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.waste_listings (id) ON DELETE SET NULL,
  category text,
  material_name text,
  confidence numeric,
  analysis_json jsonb NOT NULL,
  confirmed_by_user boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_listing_analyses_user_id_idx
  ON public.ai_listing_analyses (user_id);
CREATE INDEX IF NOT EXISTS ai_listing_analyses_company_id_idx
  ON public.ai_listing_analyses (company_id);
CREATE INDEX IF NOT EXISTS ai_listing_analyses_listing_id_idx
  ON public.ai_listing_analyses (listing_id);

ALTER TABLE public.ai_listing_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_listing_analyses_select_own ON public.ai_listing_analyses;
CREATE POLICY ai_listing_analyses_select_own ON public.ai_listing_analyses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_listing_analyses_insert_own ON public.ai_listing_analyses;
CREATE POLICY ai_listing_analyses_insert_own ON public.ai_listing_analyses
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS ai_listing_analyses_update_own ON public.ai_listing_analyses;
CREATE POLICY ai_listing_analyses_update_own ON public.ai_listing_analyses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
