import type { SupabaseClient } from "@supabase/supabase-js"
import type { Match } from "@/lib/types"
import { matchPassesFilters, type ParsedMatchFilters } from "@/lib/matching/filters"

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

  return new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime()
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

  return ((data ?? []) as MatchView[]).filter((match) => match.requirement && match.listing)
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

  if (error) throw new Error(error.message)

  const matches = await fetchMatchesForRequirementIds(
    supabase,
    (requirements ?? []).map((row) => row.id),
  )

  return matches.filter((match) => matchPassesFilters(match, filters)).sort(sortMatches)
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

  if (error) throw new Error(error.message)

  const listingIds = new Set((listings ?? []).map((row) => row.id))
  if (listingIds.size === 0) return [] as MatchView[]

  const { data, error: matchError } = await supabase.from("matches").select(MATCH_SELECT)

  if (matchError) throw new Error(matchError.message)

  return ((data ?? []) as MatchView[])
    .filter(
      (match) =>
        match.requirement &&
        match.listing &&
        listingIds.has(match.listing_id) &&
        listingIds.has(match.listing.id),
    )
    .filter((match) => matchPassesFilters(match, filters))
    .sort(sortMatches)
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
