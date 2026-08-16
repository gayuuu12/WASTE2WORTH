-- Phase 4B: supplier counter-offers + prevent duplicate transactions per offer

-- One transaction per accepted offer
CREATE UNIQUE INDEX IF NOT EXISTS transactions_offer_id_unique
  ON public.transactions (offer_id)
  WHERE offer_id IS NOT NULL;

-- Suppliers may insert counter-offers on their listings
DROP POLICY IF EXISTS offers_insert_supplier_counter ON public.offers;
CREATE POLICY offers_insert_supplier_counter ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (
    supplier_company_id = public.current_user_company_id()
    AND created_by = auth.uid()
    AND is_counter = true
    AND parent_offer_id IS NOT NULL
  );
