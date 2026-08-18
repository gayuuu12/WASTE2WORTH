-- Canonical offer acceptance RPC: accept offer + deduct inventory + create transaction.
-- Safe to run once in production (uses CREATE OR REPLACE).

ALTER TABLE public.waste_listings
  DROP CONSTRAINT IF EXISTS waste_listings_quantity_check;

ALTER TABLE public.waste_listings
  ADD CONSTRAINT waste_listings_quantity_check CHECK (quantity >= 0);

-- Remove superseded standalone deduction RPC if present from an earlier migration.
DROP FUNCTION IF EXISTS public.deduct_listing_quantity_for_offer(uuid);

CREATE OR REPLACE FUNCTION public.accept_offer_commit_inventory(p_offer_id uuid)
RETURNS TABLE (
  transaction_id uuid,
  listing_id uuid,
  remaining_quantity numeric,
  new_status text,
  already_committed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.waste_listings%ROWTYPE;
  v_company_id uuid;
  v_new_qty numeric;
  v_new_status text;
  v_existing_txn uuid;
  v_transaction_id uuid;
  v_total_value numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_company_id := public.current_user_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  SELECT t.id INTO v_existing_txn
  FROM public.transactions t
  WHERE t.offer_id = p_offer_id;

  IF FOUND THEN
    SELECT * INTO v_listing FROM public.waste_listings WHERE id = v_offer.listing_id;
    transaction_id := v_existing_txn;
    listing_id := v_listing.id;
    remaining_quantity := v_listing.quantity;
    new_status := v_listing.status;
    already_committed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_offer.status = 'accepted' THEN
    SELECT * INTO v_listing FROM public.waste_listings WHERE id = v_offer.listing_id;
    v_total_value := ROUND(v_offer.quantity * v_offer.offered_price, 2);

    INSERT INTO public.transactions (
      offer_id,
      listing_id,
      buyer_company_id,
      supplier_company_id,
      material_name,
      quantity,
      quantity_unit,
      agreed_price,
      currency,
      total_value,
      status
    ) VALUES (
      v_offer.id,
      v_offer.listing_id,
      v_offer.buyer_company_id,
      v_offer.supplier_company_id,
      v_listing.material_name,
      v_offer.quantity,
      v_offer.quantity_unit,
      v_offer.offered_price,
      v_offer.currency,
      v_total_value,
      'agreed'
    )
    ON CONFLICT (offer_id) WHERE offer_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_transaction_id;

    IF v_transaction_id IS NULL THEN
      SELECT t.id INTO v_existing_txn
      FROM public.transactions t
      WHERE t.offer_id = p_offer_id;
      v_transaction_id := v_existing_txn;
    END IF;

    transaction_id := v_transaction_id;
    listing_id := v_listing.id;
    remaining_quantity := v_listing.quantity;
    new_status := v_listing.status;
    already_committed := false;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Offer is not pending';
  END IF;

  IF v_offer.is_counter THEN
    IF v_offer.buyer_company_id <> v_company_id THEN
      RAISE EXCEPTION 'Not authorized to accept this counteroffer';
    END IF;
  ELSE
    IF v_offer.supplier_company_id <> v_company_id THEN
      RAISE EXCEPTION 'Not authorized to accept this offer';
    END IF;
  END IF;

  SELECT * INTO v_listing FROM public.waste_listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status <> 'active' THEN
    RAISE EXCEPTION 'Listing is not available';
  END IF;

  IF v_listing.quantity_unit <> v_offer.quantity_unit THEN
    RAISE EXCEPTION 'Quantity unit mismatch';
  END IF;

  IF v_listing.quantity < v_offer.quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK:%:%', v_listing.quantity, v_listing.quantity_unit;
  END IF;

  v_new_qty := v_listing.quantity - v_offer.quantity;
  v_new_status := CASE WHEN v_new_qty = 0 THEN 'sold' ELSE v_listing.status END;

  UPDATE public.waste_listings
  SET quantity = v_new_qty, status = v_new_status, updated_at = now()
  WHERE id = v_listing.id;

  UPDATE public.offers
  SET status = 'accepted', updated_at = now()
  WHERE id = v_offer.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This offer is no longer pending and cannot be accepted.';
  END IF;

  v_total_value := ROUND(v_offer.quantity * v_offer.offered_price, 2);

  INSERT INTO public.transactions (
    offer_id,
    listing_id,
    buyer_company_id,
    supplier_company_id,
    material_name,
    quantity,
    quantity_unit,
    agreed_price,
    currency,
    total_value,
    status
  ) VALUES (
    v_offer.id,
    v_offer.listing_id,
    v_offer.buyer_company_id,
    v_offer.supplier_company_id,
    v_listing.material_name,
    v_offer.quantity,
    v_offer.quantity_unit,
    v_offer.offered_price,
    v_offer.currency,
    v_total_value,
    'agreed'
  )
  RETURNING id INTO v_transaction_id;

  transaction_id := v_transaction_id;
  listing_id := v_listing.id;
  remaining_quantity := v_new_qty;
  new_status := v_new_status;
  already_committed := false;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_offer_commit_inventory(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_offer_commit_inventory(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
