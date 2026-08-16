import type { SupabaseClient } from "@supabase/supabase-js"
import type { Offer } from "@/lib/types"

// Embed listing only. Company embeds are omitted because suppliers cannot read
// buyer company rows under default companies RLS, which causes PostgREST to drop
// offer rows from nested selects. Counterparty company names require migration
// 20260816_000005_companies_offer_counterparty_rls.sql before adding embeds.
const OFFER_SELECT = `
  *,
  listing:waste_listings!listing_id(
    id,
    title,
    material_name,
    quantity,
    quantity_unit,
    currency,
    asking_price,
    status,
    supplier_company_id,
    city,
    state,
    country
  )
`

export async function getCounterOffersForParent(
  supabase: SupabaseClient,
  parentOfferId: string,
) {
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("parent_offer_id", parentOfferId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Offer[]
}

export async function getIncomingOffers(
  supabase: SupabaseClient,
  supplierCompanyId: string,
) {
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("supplier_company_id", supplierCompanyId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Offer[]
}

export async function getSentOffers(
  supabase: SupabaseClient,
  buyerCompanyId: string,
) {
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("buyer_company_id", buyerCompanyId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Offer[]
}

export async function getOfferForParticipant(
  supabase: SupabaseClient,
  offerId: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("id", offerId)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Offer | null
}
