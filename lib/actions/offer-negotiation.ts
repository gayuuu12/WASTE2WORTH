"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { acceptOfferCommitInventory } from "@/lib/listings/inventory"
import { regenerateMatchesForListing } from "@/lib/matching/engine"
import {
  canBuyerRespondToCounter,
  canSupplierRespondToOffer,
} from "@/lib/offers/negotiation"
import { getOfferForParticipant } from "@/lib/offers/queries"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import {
  counterOfferSchema,
  offerActionSchema,
} from "@/lib/validations/offers"
import {
  notifyCounterAccepted,
  notifyCounterRejected,
  notifyCounterofferReceived,
  notifyOfferAccepted,
  notifyOfferRejected,
} from "@/lib/notifications/create"

export type NegotiationActionResult = {
  error?: string
  success?: boolean
}

async function loadOfferForCompany(offerId: string, companyId: string) {
  const supabase = await createClient()
  const offer = await getOfferForParticipant(supabase, offerId, companyId)
  if (!offer) {
    throw new Error("Offer not found or access denied.")
  }
  return { supabase, offer }
}

function revalidateListingPaths(listingId: string) {
  revalidatePath("/marketplace")
  revalidatePath("/dashboard/listings")
  revalidatePath(`/dashboard/listings/${listingId}`)
  revalidatePath(`/dashboard/listings/view/${listingId}`)
  revalidatePath("/dashboard/matches")
  revalidatePath("/dashboard/requirements")
}

async function acceptOfferAndCreateTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offer: NonNullable<Awaited<ReturnType<typeof getOfferForParticipant>>>,
) {
  const commit = await acceptOfferCommitInventory(supabase, offer.id)

  if (commit.alreadyCommitted) {
    redirect(`/dashboard/transactions/${commit.transactionId}`)
  }

  await regenerateMatchesForListing(supabase, commit.listingId, commit.newStatus)

  if (offer.is_counter) {
    await notifyCounterAccepted(supabase, offer)
  } else {
    await notifyOfferAccepted(supabase, offer)
  }

  revalidatePath("/dashboard/offers")
  revalidatePath(`/dashboard/offers/${offer.id}`)
  revalidatePath("/dashboard/transactions")
  revalidateListingPaths(commit.listingId)

  redirect(`/dashboard/transactions/${commit.transactionId}?created=1`)
}

export async function acceptOfferAction(
  _prev: NegotiationActionResult,
  formData: FormData,
): Promise<NegotiationActionResult> {
  const parsed = offerActionSchema.safeParse({ offerId: formData.get("offerId") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const { supabase, offer } = await loadOfferForCompany(
      parsed.data.offerId,
      ctx.company.id,
    )

    if (offer.is_counter) {
      if (!canBuyerRespondToCounter(offer, ctx.company.id)) {
        return { error: "You cannot accept this counteroffer." }
      }
    } else if (!canSupplierRespondToOffer(offer, ctx.company.id)) {
      return { error: "You cannot accept this offer." }
    }

    await acceptOfferAndCreateTransaction(supabase, offer)
    return { success: true }
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "Could not accept offer.",
    }
  }
}

export async function rejectOfferAction(
  _prev: NegotiationActionResult,
  formData: FormData,
): Promise<NegotiationActionResult> {
  const parsed = offerActionSchema.safeParse({ offerId: formData.get("offerId") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const { supabase, offer } = await loadOfferForCompany(
      parsed.data.offerId,
      ctx.company.id,
    )

    if (offer.is_counter) {
      if (!canBuyerRespondToCounter(offer, ctx.company.id)) {
        return { error: "You cannot reject this counteroffer." }
      }
    } else if (!canSupplierRespondToOffer(offer, ctx.company.id)) {
      return { error: "You cannot reject this offer." }
    }

    const { data, error } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offer.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()

    if (error) {
      return { error: error.message }
    }

    if (!data) {
      return { error: "This offer is no longer pending." }
    }

    if (offer.is_counter) {
      await notifyCounterRejected(supabase, offer)
    } else {
      await notifyOfferRejected(supabase, offer)
    }

    revalidatePath("/dashboard/offers")
    revalidatePath(`/dashboard/offers/${offer.id}`)
    redirect(`/dashboard/offers/${offer.id}?rejected=1`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "Could not reject offer.",
    }
  }
}

export async function counterOfferAction(
  _prev: NegotiationActionResult,
  formData: FormData,
): Promise<NegotiationActionResult> {
  const parsed = counterOfferSchema.safeParse({
    offerId: formData.get("offerId"),
    quantity: formData.get("quantity"),
    offeredPrice: formData.get("offeredPrice"),
    message: formData.get("message") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const { supabase, offer } = await loadOfferForCompany(
      parsed.data.offerId,
      ctx.company.id,
    )

    if (!canSupplierRespondToOffer(offer, ctx.company.id)) {
      return { error: "You cannot counter this offer." }
    }

    const { data: listingRow, error: listingError } = await supabase
      .from("waste_listings")
      .select("quantity, quantity_unit, status")
      .eq("id", offer.listing_id)
      .eq("status", "active")
      .maybeSingle()

    if (listingError) {
      return { error: listingError.message }
    }

    if (!listingRow) {
      return { error: "Listing is no longer available." }
    }

    if (parsed.data.quantity > listingRow.quantity) {
      const formatted = listingRow.quantity.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })
      return {
        error: `Only ${formatted} ${listingRow.quantity_unit} is currently available.`,
      }
    }

    const { data: counter, error: counterError } = await supabase
      .from("offers")
      .insert({
        listing_id: offer.listing_id,
        buyer_company_id: offer.buyer_company_id,
        supplier_company_id: offer.supplier_company_id,
        created_by: ctx.user.id,
        offered_price: parsed.data.offeredPrice,
        quantity: parsed.data.quantity,
        quantity_unit: offer.quantity_unit,
        currency: offer.currency,
        message: parsed.data.message?.trim() || null,
        status: "pending",
        is_counter: true,
        parent_offer_id: offer.id,
      })
      .select("id")
      .single()

    if (counterError) {
      return { error: counterError.message }
    }

    const { error: parentError } = await supabase
      .from("offers")
      .update({ status: "countered" })
      .eq("id", offer.id)
      .eq("status", "pending")

    if (parentError) {
      return { error: parentError.message }
    }

    await notifyCounterofferReceived(supabase, {
      id: counter.id,
      buyer_company_id: offer.buyer_company_id,
      parent_offer_id: offer.id,
    })

    revalidatePath("/dashboard/offers")
    revalidatePath(`/dashboard/offers/${offer.id}`)

    redirect(`/dashboard/offers/${counter.id}?countered=1`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "Could not submit counteroffer.",
    }
  }
}
