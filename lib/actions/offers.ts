"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { canMakeOfferOnListing } from "@/lib/offers/auth"
import { requireBuyerContext } from "@/lib/requirements/auth"
import { offerFormSchema } from "@/lib/validations/offers"
import { createClient } from "@/lib/supabase/server"

export type OfferActionResult = {
  error?: string
  success?: boolean
}

function parseOfferForm(formData: FormData) {
  return offerFormSchema.safeParse({
    listingId: formData.get("listingId"),
    quantity: formData.get("quantity"),
    quantityUnit: formData.get("quantityUnit"),
    offeredPrice: formData.get("offeredPrice"),
    currency: formData.get("currency"),
    message: formData.get("message") || undefined,
  })
}

export async function createOfferAction(
  _prevState: OfferActionResult,
  formData: FormData,
): Promise<OfferActionResult> {
  const parsed = parseOfferForm(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const ctx = await requireBuyerContext()
  const supabase = await createClient()

  const { data: listingRow, error: listingLookupError } = await supabase
    .from("waste_listings")
    .select("id, supplier_company_id, quantity, quantity_unit, status")
    .eq("id", parsed.data.listingId)
    .eq("status", "active")
    .maybeSingle()

  if (listingLookupError) {
    return { error: listingLookupError.message }
  }

  if (!listingRow?.supplier_company_id) {
    return { error: "Listing not found or is no longer active." }
  }

  const listing = {
    id: listingRow.id,
    supplier_company_id: listingRow.supplier_company_id,
    quantity: listingRow.quantity,
    quantity_unit: listingRow.quantity_unit,
    status: listingRow.status as "active",
  }

  if (!canMakeOfferOnListing(ctx.company, listing)) {
    return { error: "You are not allowed to make an offer on this listing." }
  }

  if (parsed.data.quantity > listing.quantity) {
    return {
      error: `Offered quantity cannot exceed available quantity (${listing.quantity} ${listing.quantity_unit}).`,
    }
  }

  if (parsed.data.quantityUnit !== listing.quantity_unit) {
    return {
      error: `Quantity unit must match the listing unit (${listing.quantity_unit}).`,
    }
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      listing_id: listing.id,
      buyer_company_id: ctx.company.id,
      supplier_company_id: listing.supplier_company_id,
      created_by: ctx.user.id,
      offered_price: parsed.data.offeredPrice,
      quantity: parsed.data.quantity,
      quantity_unit: parsed.data.quantityUnit,
      currency: parsed.data.currency,
      message: parsed.data.message?.trim() || null,
      status: "pending",
      is_counter: false,
      parent_offer_id: null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/offers")
  revalidatePath(`/dashboard/listings/view/${listing.id}`)

  redirect(`/dashboard/offers/${offer.id}?created=1`)
}
