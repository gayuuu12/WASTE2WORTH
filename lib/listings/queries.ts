import type { SupabaseClient } from "@supabase/supabase-js"
import {
  hasActiveMarketplaceFilters,
  rankMarketplaceListings,
  type MarketplaceRecommendation,
  type MarketplaceSearchContext,
} from "@/lib/listings/marketplace-recommendations"
import type { MarketplaceFilters } from "@/lib/validations/listings"
import type { WasteListing } from "@/lib/types"

const LISTING_SELECT = `
  *,
  category:waste_categories(*),
  company:companies(id, name, verification_status, city, state, country),
  images:listing_images(*)
`

export async function getCompanyListings(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(`${LISTING_SELECT}`)
    .eq("supplier_company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as WasteListing[]
}

export async function getActiveListingCount(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { count, error } = await supabase
    .from("waste_listings")
    .select("*", { count: "exact", head: true })
    .eq("supplier_company_id", companyId)
    .eq("status", "active")

  if (error) return 0
  return count ?? 0
}

export async function getRecentCompanyListings(
  supabase: SupabaseClient,
  companyId: string,
  limit = 5,
) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(`${LISTING_SELECT}`)
    .eq("supplier_company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as WasteListing[]
}

export async function getPublicListing(
  supabase: SupabaseClient,
  listingId: string,
) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(`${LISTING_SELECT}`)
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as WasteListing | null
}

export async function getMarketplaceListings(
  supabase: SupabaseClient,
  filters: MarketplaceFilters,
  options?: {
    buyerLatitude?: number | null
    buyerLongitude?: number | null
  },
): Promise<{
  strong: MarketplaceRecommendation[]
  alternatives: MarketplaceRecommendation[]
  hasActiveFilters: boolean
}> {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(`${LISTING_SELECT}`)
    .eq("status", "active")

  if (error) {
    throw new Error(error.message)
  }

  const listings = (data ?? []) as WasteListing[]
  const context: MarketplaceSearchContext = {
    filters,
    buyerLatitude: options?.buyerLatitude,
    buyerLongitude: options?.buyerLongitude,
  }

  return rankMarketplaceListings(listings, context)
}

/** Flat ranked listing list for callers that only need ordered listings. */
export async function getRankedMarketplaceListings(
  supabase: SupabaseClient,
  filters: MarketplaceFilters,
  options?: {
    buyerLatitude?: number | null
    buyerLongitude?: number | null
  },
): Promise<MarketplaceRecommendation[]> {
  const results = await getMarketplaceListings(supabase, filters, options)
  if (!results.hasActiveFilters) {
    return results.strong
  }
  return [...results.strong, ...results.alternatives]
}

export function marketplaceResultsAreEmpty(results: {
  strong: MarketplaceRecommendation[]
  alternatives: MarketplaceRecommendation[]
  hasActiveFilters: boolean
}) {
  if (!results.hasActiveFilters) {
    return results.strong.length === 0
  }
  return results.strong.length === 0 && results.alternatives.length === 0
}

export { hasActiveMarketplaceFilters }

export function getPrimaryImage(listing: WasteListing) {
  return listing.images?.[0] ?? null
}
