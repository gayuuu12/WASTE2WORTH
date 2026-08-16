-- Phase 5A: messaging hardening (run manually in Supabase SQL editor)
--
-- 1. Prevent duplicate conversations for the same buyer/supplier/listing trio
-- 2. Allow participants to read counterparty company name (avoid PostgREST embed trap)
-- 3. Require sender_company_id matches the authenticated user's company on insert

CREATE UNIQUE INDEX IF NOT EXISTS conversations_participants_listing_unique
  ON public.conversations (buyer_company_id, supplier_company_id, listing_id)
  WHERE listing_id IS NOT NULL;

DROP POLICY IF EXISTS companies_select_conversation_counterparty ON public.companies;
CREATE POLICY companies_select_conversation_counterparty ON public.companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE (
        c.buyer_company_id = public.current_user_company_id()
        AND c.supplier_company_id = companies.id
      ) OR (
        c.supplier_company_id = public.current_user_company_id()
        AND c.buyer_company_id = companies.id
      )
    )
  );

DROP POLICY IF EXISTS messages_insert_participant ON public.messages;
CREATE POLICY messages_insert_participant ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_company_id = public.current_user_company_id()
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
