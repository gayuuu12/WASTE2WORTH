import type { SupabaseClient } from "@supabase/supabase-js"
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
) {
  let query = supabase
    .from("waste_listings")
    .select(`${LISTING_SELECT}`)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (filters.category?.trim()) {
    query = query.eq("category_id", filters.category.trim())
  }

  if (filters.material?.trim()) {
    query = query.ilike("material_name", `%${filters.material.trim()}%`)
  }

  if (filters.city?.trim()) {
    query = query.ilike("city", `%${filters.city.trim()}%`)
  }

  if (filters.state?.trim()) {
    query = query.ilike("state", `%${filters.state.trim()}%`)
  }

  if (filters.minQuantity?.trim()) {
    const minQty = Number(filters.minQuantity)
    if (Number.isFinite(minQty)) {
      query = query.gte("quantity", minQty)
    }
  }

  if (filters.maxPrice?.trim()) {
    const maxPrice = Number(filters.maxPrice)
    if (Number.isFinite(maxPrice)) {
      query = query.lte("asking_price", maxPrice)
    }
  }

  if (filters.recurring === "true") {
    query = query.eq("recurring", true)
  } else if (filters.recurring === "false") {
    query = query.eq("recurring", false)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  let listings = (data ?? []) as WasteListing[]

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    listings = listings.filter((listing) => {
      const haystack = [
        listing.title,
        listing.description,
        listing.material_name,
        listing.city,
        listing.state,
        listing.company?.name,
        listing.category?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }

  if (filters.verified === "true") {
    listings = listings.filter(
      (listing) => listing.company?.verification_status === "verified",
    )
  }

  return listings
}

export function getPrimaryImage(listing: WasteListing) {
  return listing.images?.[0] ?? null
}
