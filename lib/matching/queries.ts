import type { SupabaseClient } from "@supabase/supabase-js"
import type { Match } from "@/lib/types"
import {
  isActiveMatchRecord,
  matchPassesFilters,
  type ParsedMatchFilters,
} from "@/lib/matching/filters"

const MATCH_SELECT = `
  *,
  requirement:buyer_requirements(
    *,
    category:waste_categories(*)
  ),
  listing:waste_listings(
    *,
    category:waste_categories(*),
    company:companies(id, name, verification_status, city, state, country)
  )
`

export interface MatchView extends Match {
  requirement: NonNullable<Match["requirement"]>
  listing: NonNullable<Match["listing"]>
}

function sortMatches(a: MatchView, b: MatchView) {
  if (b.score !== a.score) return b.score - a.score

  const distA = a.distance_km ?? Number.POSITIVE_INFINITY
  const distB = b.distance_km ?? Number.POSITIVE_INFINITY
  if (distA !== distB) return distA - distB

  const breakdownA = a.score_breakdown
  const breakdownB = b.score_breakdown
  const priceA = breakdownA?.price ?? -1
  const priceB = breakdownB?.price ?? -1
  if (priceB !== priceA) return priceB - priceA

  const quantityA = breakdownA?.quantity ?? -1
  const quantityB = breakdownB?.quantity ?? -1
  if (quantityB !== quantityA) return quantityB - quantityA

  const verifiedA = a.listing.company?.verification_status === "verified" ? 1 : 0
  const verifiedB = b.listing.company?.verification_status === "verified" ? 1 : 0
  if (verifiedB !== verifiedA) return verifiedB - verifiedA

  return new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime()
}

function normalizeMatches(rows: MatchView[]): MatchView[] {
  return rows.filter((match) => match.requirement && match.listing && isActiveMatchRecord(match))
}

async function fetchMatchesForRequirementIds(
  supabase: SupabaseClient,
  requirementIds: string[],
) {
  if (requirementIds.length === 0) return [] as MatchView[]

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in("requirement_id", requirementIds)

  if (error) throw new Error(error.message)

  return normalizeMatches((data ?? []) as MatchView[])
}

async function fetchMatchesForListingIds(supabase: SupabaseClient, listingIds: string[]) {
  if (listingIds.length === 0) return [] as MatchView[]

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in("listing_id", listingIds)

  if (error) throw new Error(error.message)

  return normalizeMatches((data ?? []) as MatchView[])
}

function applyFilters(matches: MatchView[], filters: ParsedMatchFilters) {
  return matches.filter((match) => matchPassesFilters(match, filters)).sort(sortMatches)
}

export async function getBuyerMatches(
  supabase: SupabaseClient,
  companyId: string,
  filters: ParsedMatchFilters,
) {
  const { data: requirements, error } = await supabase
    .from("buyer_requirements")
    .select("id")
    .eq("buyer_company_id", companyId)
    .eq("status", "active")

  if (error) throw new Error(error.message)

  const requirementIds = (requirements ?? []).map((row) => row.id)
  const matches = await fetchMatchesForRequirementIds(supabase, requirementIds)

  return applyFilters(matches, filters)
}

export async function getSupplierMatches(
  supabase: SupabaseClient,
  companyId: string,
  filters: ParsedMatchFilters,
) {
  const { data: listings, error } = await supabase
    .from("waste_listings")
    .select("id")
    .eq("supplier_company_id", companyId)
    .eq("status", "active")

  if (error) throw new Error(error.message)

  const listingIds = (listings ?? []).map((row) => row.id)
  const matches = await fetchMatchesForListingIds(supabase, listingIds)

  return applyFilters(matches, filters)
}

export async function getMatchesForRequirement(
  supabase: SupabaseClient,
  requirementId: string,
  companyId: string,
  limit?: number,
) {
  const { data: requirement, error } = await supabase
    .from("buyer_requirements")
    .select("id")
    .eq("id", requirementId)
    .eq("buyer_company_id", companyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!requirement) return [] as MatchView[]

  const matches = await fetchMatchesForRequirementIds(supabase, [requirementId])
  const sorted = matches.sort(sortMatches)
  return limit != null ? sorted.slice(0, limit) : sorted
}

export async function getMatchesForListing(
  supabase: SupabaseClient,
  listingId: string,
  companyId: string,
  limit?: number,
) {
  const { data: listing, error } = await supabase
    .from("waste_listings")
    .select("id")
    .eq("id", listingId)
    .eq("supplier_company_id", companyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!listing) return [] as MatchView[]

  const matches = await fetchMatchesForListingIds(supabase, [listingId])
  const sorted = matches.sort(sortMatches)
  return limit != null ? sorted.slice(0, limit) : sorted
}

export async function getTopMatchesForBuyer(
  supabase: SupabaseClient,
  companyId: string,
  limit = 5,
) {
  const matches = await getBuyerMatches(supabase, companyId, {})
  return matches.slice(0, limit)
}

export async function getTopMatchesForSupplier(
  supabase: SupabaseClient,
  companyId: string,
  limit = 5,
) {
  const matches = await getSupplierMatches(supabase, companyId, {})
  return matches.slice(0, limit)
}

export async function getBuyerMatchCount(supabase: SupabaseClient, companyId: string) {
  const matches = await getBuyerMatches(supabase, companyId, {})
  return matches.length
}

export async function getActiveRequirementCount(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { count, error } = await supabase
    .from("buyer_requirements")
    .select("*", { count: "exact", head: true })
    .eq("buyer_company_id", companyId)
    .eq("status", "active")

  if (error) return 0
  return count ?? 0
}

export async function getSupplierMatchOpportunityCount(
  supabase: SupabaseClient,
  companyId: string,
) {
  const matches = await getSupplierMatches(supabase, companyId, { minScore: 70 })
  return matches.length
}
