-- Listing inventory: quantity represents current available stock (decrements on accepted sales)

ALTER TABLE public.waste_listings
  DROP CONSTRAINT IF EXISTS waste_listings_quantity_check;

ALTER TABLE public.waste_listings
  ADD CONSTRAINT waste_listings_quantity_check CHECK (quantity >= 0);

-- Atomically deduct listing stock when an offer is accepted (supplier or buyer on counter).
CREATE OR REPLACE FUNCTION public.deduct_listing_quantity_for_offer(p_offer_id uuid)
RETURNS TABLE (
  remaining_quantity numeric,
  new_status text,
  listing_id uuid
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
BEGIN
  v_company_id := public.current_user_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
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

  remaining_quantity := v_new_qty;
  new_status := v_new_status;
  listing_id := v_listing.id;
  RETURN NEXT;
END;
$$;

-- Roll back stock if transaction creation fails after deduction.
CREATE OR REPLACE FUNCTION public.restore_listing_quantity(
  p_listing_id uuid,
  p_restore numeric,
  p_unit text
)
RETURNS TABLE (remaining_quantity numeric, new_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.waste_listings%ROWTYPE;
  v_company_id uuid;
  v_new_qty numeric;
  v_new_status text;
BEGIN
  v_company_id := public.current_user_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_restore <= 0 THEN
    RAISE EXCEPTION 'Restore amount must be positive';
  END IF;

  SELECT * INTO v_listing FROM public.waste_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.quantity_unit <> p_unit THEN
    RAISE EXCEPTION 'Quantity unit mismatch';
  END IF;

  IF NOT (
    v_listing.supplier_company_id = v_company_id
    OR EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.listing_id = p_listing_id
        AND o.buyer_company_id = v_company_id
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_new_qty := v_listing.quantity + p_restore;
  v_new_status := CASE
    WHEN v_listing.status = 'sold' AND v_new_qty > 0 THEN 'active'
    ELSE v_listing.status
  END;

  UPDATE public.waste_listings
  SET quantity = v_new_qty, status = v_new_status, updated_at = now()
  WHERE id = p_listing_id;

  remaining_quantity := v_new_qty;
  new_status := v_new_status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_listing_quantity_for_offer(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_listing_quantity(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_listing_quantity_for_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_listing_quantity(uuid, numeric, text) TO authenticated;
