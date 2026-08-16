-- Phase 5B: secure counterparty notifications + Realtime publication
-- Run manually in Supabase SQL editor.

-- Secure server-side notification creation for marketplace counterparty events.
-- Validates the actor's company is a participant before inserting for target company users.
CREATE OR REPLACE FUNCTION public.notify_marketplace_counterparty(
  p_target_company_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text DEFAULT NULL,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_company_id uuid;
  v_valid boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_actor_company_id := public.current_user_company_id();
  IF v_actor_company_id IS NULL THEN
    RAISE EXCEPTION 'No company for authenticated user';
  END IF;

  IF p_target_company_id = v_actor_company_id THEN
    RETURN;
  END IF;

  IF p_data ? 'offer_id' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.id = (p_data->>'offer_id')::uuid
        AND (
          (
            o.buyer_company_id = v_actor_company_id
            AND o.supplier_company_id = p_target_company_id
          )
          OR (
            o.supplier_company_id = v_actor_company_id
            AND o.buyer_company_id = p_target_company_id
          )
        )
    ) INTO v_valid;
  ELSIF p_data ? 'transaction_id' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.transactions t
      WHERE t.id = (p_data->>'transaction_id')::uuid
        AND (
          (
            t.buyer_company_id = v_actor_company_id
            AND t.supplier_company_id = p_target_company_id
          )
          OR (
            t.supplier_company_id = v_actor_company_id
            AND t.buyer_company_id = p_target_company_id
          )
        )
    ) INTO v_valid;
  ELSIF p_data ? 'conversation_id' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = (p_data->>'conversation_id')::uuid
        AND (
          (
            c.buyer_company_id = v_actor_company_id
            AND c.supplier_company_id = p_target_company_id
          )
          OR (
            c.supplier_company_id = v_actor_company_id
            AND c.buyer_company_id = p_target_company_id
          )
        )
    ) INTO v_valid;
  ELSE
    RAISE EXCEPTION 'Notification context required (offer_id, transaction_id, or conversation_id)';
  END IF;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid notification recipient or context';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  SELECT p.id, p_type, p_title, p_body, p_link, p_data
  FROM public.profiles p
  WHERE p.company_id = p_target_company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_marketplace_counterparty(uuid, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_marketplace_counterparty(uuid, text, text, text, text, jsonb) TO authenticated;

-- Enable Realtime for messaging and notifications (RLS still enforced).
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
