import type { Offer, OfferStatus } from "@/lib/types"

export const TERMINAL_OFFER_STATUSES: OfferStatus[] = [
  "accepted",
  "rejected",
  "withdrawn",
  "expired",
]

export function isTerminalOfferStatus(status: OfferStatus) {
  return TERMINAL_OFFER_STATUSES.includes(status)
}

export function canSupplierRespondToOffer(offer: Offer, supplierCompanyId: string) {
  return (
    !offer.is_counter &&
    offer.status === "pending" &&
    offer.supplier_company_id === supplierCompanyId
  )
}

export function canBuyerRespondToCounter(offer: Offer, buyerCompanyId: string) {
  return (
    offer.is_counter &&
    offer.status === "pending" &&
    offer.buyer_company_id === buyerCompanyId
  )
}

export function getOfferSide(
  offer: Pick<Offer, "buyer_company_id" | "supplier_company_id">,
  companyId: string,
): "buyer" | "supplier" | null {
  if (offer.buyer_company_id === companyId) return "buyer"
  if (offer.supplier_company_id === companyId) return "supplier"
  return null
}
