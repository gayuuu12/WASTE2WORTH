import type { SupabaseClient } from "@supabase/supabase-js"
import { MATCH_STORE_MIN_SCORE } from "@/lib/matching/constants"
import { buildMatchScoreBreakdown, hasMaterialRelevance } from "@/lib/matching/scores"
import type { BuyerRequirement, ListingStatus, WasteListing } from "@/lib/types"

const LISTING_SELECT = `
  *,
  category:waste_categories(*),
  company:companies(id, name, verification_status, city, state, country)
`

const REQUIREMENT_SELECT = `
  *,
  category:waste_categories(*)
`

function logMatchDiag(action: string, detail: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log("[MATCHING]", action, detail)
  }
}

export async function fetchActiveListings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(LISTING_SELECT)
    .eq("status", "active")

  if (error) throw new Error(error.message)
  return (data ?? []) as WasteListing[]
}

export async function fetchActiveRequirements(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("buyer_requirements")
    .select(REQUIREMENT_SELECT)
    .eq("status", "active")

  if (error) throw new Error(error.message)
  return (data ?? []) as BuyerRequirement[]
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

export async function fetchListingById(supabase: SupabaseClient, listingId: string) {
  const { data, error } = await supabase
    .from("waste_listings")
    .select(LISTING_SELECT)
    .eq("id", listingId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as WasteListing | null
}

async function upsertMatchRow(
  supabase: SupabaseClient,
  requirementId: string,
  listingId: string,
  score: number,
  breakdown: ReturnType<typeof buildMatchScoreBreakdown>["breakdown"],
  distanceKm: number | null,
) {
  const { error } = await supabase.from("matches").upsert(
    {
      requirement_id: requirementId,
      listing_id: listingId,
      score,
      score_breakdown: breakdown,
      distance_km: distanceKm,
    },
    { onConflict: "requirement_id,listing_id" },
  )

  if (error) throw new Error(error.message)

  logMatchDiag("upsert", {
    requirement_id: requirementId,
    listing_id: listingId,
    new_score: score,
  })
}

async function deleteMatchPair(
  supabase: SupabaseClient,
  requirementId: string,
  listingId: string,
  reason: string,
) {
  await supabase
    .from("matches")
    .delete()
    .eq("requirement_id", requirementId)
    .eq("listing_id", listingId)

  logMatchDiag("removed", {
    requirement_id: requirementId,
    listing_id: listingId,
    reason,
  })
}

export async function generateMatchesForRequirement(
  supabase: SupabaseClient,
  requirementId: string,
) {
  const requirement = await fetchRequirementById(supabase, requirementId)

  if (!requirement || requirement.status !== "active") {
    await supabase.from("matches").delete().eq("requirement_id", requirementId)
    logMatchDiag("cleared_requirement", { requirement_id: requirementId })
    return { generated: 0, removed: true }
  }

  const listings = await fetchActiveListings(supabase)
  let generated = 0

  for (const listing of listings) {
    const { breakdown, overall, distanceKm } = buildMatchScoreBreakdown(requirement, listing)

    if (overall < MATCH_STORE_MIN_SCORE || !hasMaterialRelevance(requirement, listing)) {
      await deleteMatchPair(supabase, requirementId, listing.id, "below_threshold")
      continue
    }

    await upsertMatchRow(supabase, requirementId, listing.id, overall, breakdown, distanceKm)
    generated += 1
  }

  return { generated, removed: false }
}

export async function generateMatchesForListing(
  supabase: SupabaseClient,
  listingId: string,
) {
  const listing = await fetchListingById(supabase, listingId)

  if (!listing || listing.status !== "active") {
    await supabase.from("matches").delete().eq("listing_id", listingId)
    logMatchDiag("cleared_listing", { listing_id: listingId })
    return { generated: 0, removed: true }
  }

  const requirements = await fetchActiveRequirements(supabase)
  let generated = 0

  for (const requirement of requirements) {
    const { breakdown, overall, distanceKm } = buildMatchScoreBreakdown(requirement, listing)

    if (overall < MATCH_STORE_MIN_SCORE || !hasMaterialRelevance(requirement, listing)) {
      await deleteMatchPair(supabase, requirement.id, listingId, "below_threshold")
      continue
    }

    await upsertMatchRow(supabase, requirement.id, listingId, overall, breakdown, distanceKm)
    generated += 1
  }

  return { generated, removed: false }
}

export async function regenerateMatchesForListing(
  supabase: SupabaseClient,
  listingId: string,
  status: ListingStatus,
) {
  if (status === "active") {
    return generateMatchesForListing(supabase, listingId)
  }

  await supabase.from("matches").delete().eq("listing_id", listingId)
  logMatchDiag("cleared_listing", { listing_id: listingId, status })
  return { generated: 0, removed: true }
}

export async function syncMatchesForBuyerCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("buyer_requirements")
    .select("id, status")
    .eq("buyer_company_id", companyId)

  if (error) throw new Error(error.message)

  let total = 0
  for (const requirement of data ?? []) {
    if (requirement.status === "active") {
      const result = await generateMatchesForRequirement(supabase, requirement.id)
      total += result.generated
    } else {
      await supabase.from("matches").delete().eq("requirement_id", requirement.id)
    }
  }

  return total
}

export async function syncMatchesForSupplierCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data: listings, error } = await supabase
    .from("waste_listings")
    .select("id, status")
    .eq("supplier_company_id", companyId)

  if (error) throw new Error(error.message)

  let total = 0
  for (const listing of listings ?? []) {
    if (listing.status === "active") {
      const result = await generateMatchesForListing(supabase, listing.id)
      total += result.generated
    } else {
      await supabase.from("matches").delete().eq("listing_id", listing.id)
    }
  }

  return total
}
