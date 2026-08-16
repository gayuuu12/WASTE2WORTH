import type { SupabaseClient } from "@supabase/supabase-js"
import { MATCH_STORE_MIN_SCORE } from "@/lib/matching/constants"
import { buildMatchScoreBreakdown } from "@/lib/matching/scores"
import type { BuyerRequirement, WasteListing } from "@/lib/types"

const LISTING_SELECT = `
  *,
  category:waste_categories(*),
  company:companies(id, name, verification_status, city, state, country)
`

const REQUIREMENT_SELECT = `
  *,
  category:waste_categories(*)
`

export async function fetchActiveListings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(LISTING_SELECT)
    .eq("status", "active")

  if (error) throw new Error(error.message)
  return (data ?? []) as WasteListing[]
}

export async function fetchRequirementById(
  supabase: SupabaseClient,
  requirementId: string,
) {
  const { data, error } = await supabase
    .from("buyer_requirements")
    .select(REQUIREMENT_SELECT)
    .eq("id", requirementId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as BuyerRequirement | null
}

export async function generateMatchesForRequirement(
  supabase: SupabaseClient,
  requirementId: string,
) {
  const requirement = await fetchRequirementById(supabase, requirementId)

  if (!requirement || requirement.status !== "active") {
    await supabase.from("matches").delete().eq("requirement_id", requirementId)
    return { generated: 0, removed: true }
  }

  const listings = await fetchActiveListings(supabase)
  let generated = 0

  for (const listing of listings) {
    const { breakdown, overall, distanceKm } = buildMatchScoreBreakdown(requirement, listing)

    if (overall < MATCH_STORE_MIN_SCORE || breakdown.material <= 0) {
      await supabase
        .from("matches")
        .delete()
        .eq("requirement_id", requirementId)
        .eq("listing_id", listing.id)
      continue
    }

    const { error } = await supabase.from("matches").upsert(
      {
        requirement_id: requirementId,
        listing_id: listing.id,
        score: overall,
        score_breakdown: breakdown,
        distance_km: distanceKm,
        status: "suggested",
      },
      { onConflict: "requirement_id,listing_id" },
    )

    if (!error) generated += 1
  }

  return { generated, removed: false }
}

export async function syncMatchesForBuyerCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("buyer_requirements")
    .select("id")
    .eq("buyer_company_id", companyId)
    .eq("status", "active")

  if (error) throw new Error(error.message)

  let total = 0
  for (const requirement of data ?? []) {
    const result = await generateMatchesForRequirement(supabase, requirement.id)
    total += result.generated
  }

  return total
}

export async function syncMatchesForSupplierCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data: requirements, error } = await supabase
    .from("buyer_requirements")
    .select("id")
    .eq("status", "active")

  if (error) throw new Error(error.message)

  const { data: listings, error: listingError } = await supabase
    .from("waste_listings")
    .select("id")
    .eq("supplier_company_id", companyId)
    .eq("status", "active")

  if (listingError) throw new Error(listingError.message)

  const listingIds = new Set((listings ?? []).map((listing) => listing.id))
  if (listingIds.size === 0) return 0

  let total = 0
  for (const requirement of requirements ?? []) {
    const result = await generateMatchesForRequirement(supabase, requirement.id)
    total += result.generated
  }

  return total
}
