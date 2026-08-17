-- Phase 6C: Buyer-reported material recovery outcomes (post-transaction)

CREATE TABLE IF NOT EXISTS public.material_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  buyer_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  supplier_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  outcome_type text NOT NULL CHECK (
    outcome_type IN (
      'reused_directly',
      'repaired',
      'refurbished',
      'remanufactured',
      'recycled',
      'composted',
      'energy_recovery',
      'other'
    )
  ),
  input_quantity numeric NOT NULL CHECK (input_quantity > 0),
  input_quantity_unit text NOT NULL,
  recovered_quantity numeric NOT NULL CHECK (recovered_quantity >= 0),
  recovered_quantity_unit text NOT NULL,
  resulting_product text,
  resulting_product_category text,
  processing_method text,
  notes text,
  verification_status text NOT NULL DEFAULT 'buyer_reported' CHECK (
    verification_status IN ('buyer_reported', 'supplier_confirmed', 'verified')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT material_outcomes_transaction_unique UNIQUE (transaction_id),
  CONSTRAINT material_outcomes_recovered_lte_input CHECK (recovered_quantity <= input_quantity),
  CONSTRAINT material_outcomes_units_match CHECK (input_quantity_unit = recovered_quantity_unit)
);

CREATE INDEX IF NOT EXISTS material_outcomes_buyer_company_id_idx
  ON public.material_outcomes (buyer_company_id);

CREATE INDEX IF NOT EXISTS material_outcomes_supplier_company_id_idx
  ON public.material_outcomes (supplier_company_id);

CREATE INDEX IF NOT EXISTS material_outcomes_transaction_id_idx
  ON public.material_outcomes (transaction_id);

DROP TRIGGER IF EXISTS material_outcomes_set_updated_at ON public.material_outcomes;
CREATE TRIGGER material_outcomes_set_updated_at
  BEFORE UPDATE ON public.material_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.material_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS material_outcomes_select_participant ON public.material_outcomes;
CREATE POLICY material_outcomes_select_participant ON public.material_outcomes
  FOR SELECT TO authenticated
  USING (
    buyer_company_id = public.current_user_company_id()
    OR supplier_company_id = public.current_user_company_id()
  );

DROP POLICY IF EXISTS material_outcomes_insert_buyer ON public.material_outcomes;
CREATE POLICY material_outcomes_insert_buyer ON public.material_outcomes
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_company_id = public.current_user_company_id()
    AND EXISTS (
      SELECT 1
      FROM public.transactions t
      WHERE t.id = transaction_id
        AND t.buyer_company_id = public.current_user_company_id()
        AND t.status = 'completed'
    )
  );

DROP POLICY IF EXISTS material_outcomes_update_buyer ON public.material_outcomes;
CREATE POLICY material_outcomes_update_buyer ON public.material_outcomes
  FOR UPDATE TO authenticated
  USING (buyer_company_id = public.current_user_company_id())
  WITH CHECK (buyer_company_id = public.current_user_company_id());

DROP POLICY IF EXISTS material_outcomes_update_supplier_confirm ON public.material_outcomes;
CREATE POLICY material_outcomes_update_supplier_confirm ON public.material_outcomes
  FOR UPDATE TO authenticated
  USING (supplier_company_id = public.current_user_company_id())
  WITH CHECK (
    supplier_company_id = public.current_user_company_id()
    AND verification_status IN ('supplier_confirmed', 'buyer_reported')
  );
