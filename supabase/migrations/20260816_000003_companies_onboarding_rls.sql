-- Fix onboarding/registration: allow company creators to read and update their
-- company before profiles.company_id is linked.
--
-- Root cause: INSERT ... RETURNING (used by .insert().select()) applies SELECT
-- policies to the new row. Existing member SELECT required profile.company_id,
-- which does not exist yet during initial company creation.

-- INSERT (rename only — logic unchanged)
DROP POLICY IF EXISTS companies_insert_own ON public.companies;
DROP POLICY IF EXISTS companies_insert_authenticated ON public.companies;
CREATE POLICY companies_insert_authenticated ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- SELECT for creator during onboarding (before profile link exists)
DROP POLICY IF EXISTS companies_select_creator ON public.companies;
CREATE POLICY companies_select_creator ON public.companies
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- UPDATE for creator during onboarding (before profile link exists)
DROP POLICY IF EXISTS companies_update_creator ON public.companies;
CREATE POLICY companies_update_creator ON public.companies
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
