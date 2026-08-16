import type { SupabaseClient } from "@supabase/supabase-js"
import type { Offer, Transaction } from "@/lib/types"

const TRANSACTION_SELECT = `
  *,
  listing:waste_listings!listing_id(
    id,
    title,
    material_name,
    quantity,
    quantity_unit,
    currency,
    status,
    supplier_company_id
  )
`

export async function getTransactionForOffer(
  supabase: SupabaseClient,
  offerId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, offer_id, status")
    .eq("offer_id", offerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getCompanyTransactions(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Transaction[]
}

export async function getTransactionForParticipant(
  supabase: SupabaseClient,
  transactionId: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("id", transactionId)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Transaction | null
}

export function computeTotalValue(quantity: number, agreedPrice: number) {
  return Number((quantity * agreedPrice).toFixed(2))
}

export async function createTransactionFromOffer(
  supabase: SupabaseClient,
  offer: Offer,
  materialName: string,
) {
  const existing = await getTransactionForOffer(supabase, offer.id)
  if (existing) {
    throw new Error("A transaction already exists for this offer.")
  }

  const totalValue = computeTotalValue(offer.quantity, offer.offered_price)

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      offer_id: offer.id,
      listing_id: offer.listing_id,
      buyer_company_id: offer.buyer_company_id,
      supplier_company_id: offer.supplier_company_id,
      material_name: materialName,
      quantity: offer.quantity,
      quantity_unit: offer.quantity_unit,
      agreed_price: offer.offered_price,
      currency: offer.currency,
      total_value: totalValue,
      status: "agreed",
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("A transaction already exists for this offer.")
    }
    throw new Error(error.message)
  }

  return data.id as string
}
