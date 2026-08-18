import type { SupabaseClient } from "@supabase/supabase-js"
import type { ListingStatus } from "@/lib/types"

export type AcceptOfferCommitResult = {
  transactionId: string
  listingId: string
  remainingQuantity: number
  newStatus: ListingStatus
  alreadyCommitted: boolean
}

function parseInsufficientStock(message: string): string | null {
  const match = message.match(/INSUFFICIENT_STOCK:([^:]+):(.+)/)
  if (!match) return null
  const qty = Number(match[1])
  const unit = match[2]?.trim()
  if (!Number.isFinite(qty) || !unit) return null
  const formatted = qty.toLocaleString("en-IN", { maximumFractionDigits: 2 })
  return `Only ${formatted} ${unit} is currently available.`
}

export function formatInventoryError(message: string): string {
  return parseInsufficientStock(message) ?? message
}

export async function acceptOfferCommitInventory(
  supabase: SupabaseClient,
  offerId: string,
): Promise<AcceptOfferCommitResult> {
  const { data, error } = await supabase.rpc("accept_offer_commit_inventory", {
    p_offer_id: offerId,
  })

  if (error) {
    throw new Error(formatInventoryError(error.message))
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.transaction_id || !row?.listing_id) {
    throw new Error("Could not complete offer acceptance.")
  }

  return {
    transactionId: row.transaction_id as string,
    listingId: row.listing_id as string,
    remainingQuantity: Number(row.remaining_quantity),
    newStatus: row.new_status as ListingStatus,
    alreadyCommitted: Boolean(row.already_committed),
  }
}
