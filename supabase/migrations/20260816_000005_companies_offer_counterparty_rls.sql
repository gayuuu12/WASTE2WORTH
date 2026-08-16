-- Allow offer participants to read the counterparty company on an offer.
--
-- Root cause: suppliers querying offers with embedded buyer:companies(...) could not
-- read buyer company rows (no member/marketplace policy applied). PostgREST then
-- omitted the parent offer rows, so "Incoming offers" appeared empty while buyers
-- could still see sent offers (supplier company has an active listing).

DROP POLICY IF EXISTS companies_select_offer_counterparty ON public.companies;
CREATE POLICY companies_select_offer_counterparty ON public.companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE (
        o.buyer_company_id = public.current_user_company_id()
        AND o.supplier_company_id = companies.id
      ) OR (
        o.supplier_company_id = public.current_user_company_id()
        AND o.buyer_company_id = companies.id
      )
    )
  );
