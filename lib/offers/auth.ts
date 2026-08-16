import type { Company, WasteListing } from "@/lib/types"
import { canManageRequirements } from "@/lib/requirements/auth"

export function canMakeOffers(company: Company): boolean {
  return canManageRequirements(company)
}

export function canViewOffers(company: Company): boolean {
  return (
    company.role === "buyer" ||
    company.role === "supplier" ||
    company.role === "both"
  )
}

export function canMakeOfferOnListing(
  company: Company,
  listing: Pick<WasteListing, "status" | "supplier_company_id">,
): boolean {
  if (!canMakeOffers(company)) return false
  if (listing.status !== "active") return false
  if (listing.supplier_company_id === company.id) return false
  return true
}
