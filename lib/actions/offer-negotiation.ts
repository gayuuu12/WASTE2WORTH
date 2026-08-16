"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
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
  createTransactionFromOffer,
  getTransactionForOffer,
} from "@/lib/transactions/queries"

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

async function resolveMaterialName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offer: Awaited<ReturnType<typeof getOfferForParticipant>>,
) {
  if (offer?.listing?.material_name) {
    return offer.listing.material_name
  }

  const { data, error } = await supabase
    .from("waste_listings")
    .select("material_name")
    .eq("id", offer!.listing_id)
    .maybeSingle()

  if (error || !data?.material_name) {
    throw new Error("Listing material could not be resolved for this transaction.")
  }

  return data.material_name
}

async function acceptOfferAndCreateTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offer: NonNullable<Awaited<ReturnType<typeof getOfferForParticipant>>>,
) {
  const existing = await getTransactionForOffer(supabase, offer.id)
  if (existing) {
    redirect(`/dashboard/transactions/${existing.id}`)
  }

  const { data: updated, error: updateError } = await supabase
    .from("offers")
    .update({ status: "accepted" })
    .eq("id", offer.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!updated) {
    throw new Error("This offer is no longer pending and cannot be accepted.")
  }

  const materialName = await resolveMaterialName(supabase, offer)
  const transactionId = await createTransactionFromOffer(supabase, offer, materialName)

  revalidatePath("/dashboard/offers")
  revalidatePath(`/dashboard/offers/${offer.id}`)
  revalidatePath("/dashboard/transactions")

  redirect(`/dashboard/transactions/${transactionId}?created=1`)
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

    if (offer.listing && parsed.data.quantity > offer.listing.quantity) {
      return {
        error: `Counter quantity cannot exceed listing quantity (${offer.listing.quantity} ${offer.listing.quantity_unit}).`,
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
