import { requireCompleteProfile } from "@/lib/auth"
import type { Company, WasteListing } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export function canCreateListings(company: Company): boolean {
  return company.role === "supplier" || company.role === "both"
}

export async function requireSupplierContext() {
  const ctx = await requireCompleteProfile()

  if (!canCreateListings(ctx.company)) {
    redirect("/dashboard?error=supplier_only")
  }

  return ctx
}

export async function getOwnedListing(listingId: string, companyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("waste_listings")
    .select(
      `
      *,
      category:waste_categories(*),
      images:listing_images(*)
    `,
    )
    .eq("id", listingId)
    .eq("supplier_company_id", companyId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as WasteListing | null
}

export async function requireOwnedListing(listingId: string, companyId: string) {
  const listing = await getOwnedListing(listingId, companyId)

  if (!listing) {
    redirect("/dashboard/listings?error=not_found")
  }

  return listing
}
