import { haversineKm } from "@/lib/format"
import { DISTANCE_SCORE_TIERS, MATCH_WEIGHTS } from "@/lib/matching/constants"
import {
  combineSearchQueries,
  listingSearchHaystack,
  normalizeSearchText,
  scoreKeywordOverlap,
} from "@/lib/matching/keywords"
import {
  isDistanceScoreable,
  isPriceSpecified,
  isQualitySpecified,
  isQuantitySpecified,
} from "@/lib/matching/requirement-dimensions"
import type { BuyerRequirement, MatchScoreBreakdown, WasteListing } from "@/lib/types"

function normalize(value: string | null | undefined) {
  return normalizeSearchText(value)
}

function listingMaterialHaystack(listing: WasteListing): string {
  return listingSearchHaystack({
    materialName: listing.material_name,
    title: listing.title,
    description: listing.description,
    categoryName: listing.category?.name,
    city: listing.city,
    state: listing.state,
    companyName: listing.company?.name,
  })
}

/** Tier-based distance score — nearer suppliers rank higher; distant listings are not excluded. */
export function distanceKmToScore(distanceKm: number): number {
  for (const tier of DISTANCE_SCORE_TIERS) {
    if (distanceKm <= tier.maxKm) {
      return tier.score
    }
  }
  return DISTANCE_SCORE_TIERS[DISTANCE_SCORE_TIERS.length - 1]?.score ?? 10
}

function isPriceUnitCompatible(priceUnit: string, quantityUnit: string) {
  const unitMap: Record<string, string[]> = {
    per_kg: ["kg"],
    per_tonne: ["tonne", "kg"],
    per_unit: ["unit", "pallet", "roll"],
    lot: ["unit", "pallet", "roll", "kg", "tonne", "litre", "m3"],
  }

  const allowed = unitMap[priceUnit]
  if (!allowed) return true
  return allowed.includes(quantityUnit)
}

/** Keyword-aware material compatibility for requirement ↔ listing pairs. */
export function calculateMaterialScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number {
  const reqMaterial = normalize(requirement.material_name)
  const listingMaterial = normalize(listing.material_name)
  const haystack = listingMaterialHaystack(listing)

  let score = 0

  if (reqMaterial && listingMaterial && reqMaterial === listingMaterial) {
    score = 100
  } else if (
    reqMaterial &&
    listingMaterial &&
    (listingMaterial.includes(reqMaterial) || reqMaterial.includes(listingMaterial))
  ) {
    score = 60
  } else if (reqMaterial) {
    score = Math.max(score, scoreKeywordOverlap(reqMaterial, haystack).score)
  }

  if (
    requirement.category_id &&
    listing.category_id &&
    requirement.category_id === listing.category_id
  ) {
    score = Math.max(score, score > 0 ? Math.min(100, score + 10) : 70)
  }

  const reqGrade = normalize(requirement.desired_grade)
  const listingGrade = normalize(listing.material_grade)

  if (reqGrade && listingGrade) {
    if (reqGrade === listingGrade) {
      score = Math.min(100, score + 15)
    } else {
      score = Math.max(0, score - 20)
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Score marketplace listings from free-text / filter signals (no buyer requirement row). */
export function calculateMarketplaceMaterialScore(
  searchText: string | null | undefined,
  listing: WasteListing,
  categoryId?: string | null,
): number {
  const haystack = listingMaterialHaystack(listing)
  const query = combineSearchQueries(searchText)
  let score = 0

  if (query) {
    score = Math.max(score, scoreKeywordOverlap(query, haystack).score)
  }

  if (categoryId && listing.category_id === categoryId) {
    score = Math.max(score, score > 0 ? Math.min(100, score + 10) : 75)
  }

  return Math.round(Math.min(100, Math.max(0, score)))
}

export function calculateQuantityScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  if (!isQuantitySpecified(requirement)) return null
  if (requirement.quantity_unit !== listing.quantity_unit) return null

  const needed = requirement.quantity_needed!
  const minimum =
    requirement.minimum_acceptable_quantity != null
      ? requirement.minimum_acceptable_quantity
      : needed
  const available = listing.quantity

  if (available >= needed) return 100

  if (available >= minimum && needed > minimum) {
    const ratio = (available - minimum) / (needed - minimum)
    return Math.round(60 + ratio * 40)
  }

  if (needed > 0 && available > 0) {
    return Math.round(Math.min(50, (available / needed) * 50))
  }

  return 0
}

/** Marketplace min-quantity filter as a ranking signal (not a hard cutoff). */
export function calculateMarketplaceQuantityScore(
  minQuantity: number | null | undefined,
  listing: WasteListing,
): number | null {
  if (minQuantity == null || !Number.isFinite(minQuantity) || minQuantity <= 0) {
    return null
  }

  if (listing.quantity >= minQuantity) return 100
  if (listing.quantity > 0) {
    return Math.round(Math.min(80, (listing.quantity / minQuantity) * 80))
  }
  return 0
}

export function calculateQualityScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  if (!isQualitySpecified(requirement)) {
    return null
  }

  let score = 50

  const preferred = normalize(requirement.preferred_quality)
  const condition = normalize(listing.condition)
  const contamination = normalize(listing.contamination_level)

  if (preferred && condition) {
    if (preferred === condition || condition.includes(preferred) || preferred.includes(condition)) {
      score = 95
    } else if (preferred === "clean" && condition === "sorted") {
      score = 85
    } else if (preferred === "low-contamination" && ["none", "low"].includes(contamination)) {
      score = 90
    } else if (preferred === "dry" && normalize(listing.moisture_level) === "dry") {
      score = 90
    } else {
      score = 35
    }
  }

  if (requirement.desired_grade && listing.material_grade) {
    if (normalize(requirement.desired_grade) === normalize(listing.material_grade)) {
      score = Math.min(100, score + 15)
    } else {
      score = Math.max(0, score - 15)
    }
  }

  if (contamination === "none") score = Math.min(100, score + 5)
  if (contamination === "high") score = Math.max(0, score - 15)

  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Haversine distance score with tier bands — distant suppliers remain visible with lower scores. */
export function calculateDistanceScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): { score: number | null; distanceKm: number | null } {
  if (
    requirement.latitude == null ||
    requirement.longitude == null ||
    listing.latitude == null ||
    listing.longitude == null
  ) {
    return { score: null, distanceKm: null }
  }

  const distanceKm = haversineKm(
    requirement.latitude,
    requirement.longitude,
    listing.latitude,
    listing.longitude,
  )

  let score = distanceKmToScore(distanceKm)

  if (requirement.max_distance_km != null && distanceKm > requirement.max_distance_km) {
    score = Math.min(score, 25)
  }

  return { score, distanceKm }
}

export function calculateDistanceScoreFromCoords(
  buyerLatitude: number,
  buyerLongitude: number,
  listing: WasteListing,
): { score: number | null; distanceKm: number | null } {
  if (listing.latitude == null || listing.longitude == null) {
    return { score: null, distanceKm: null }
  }

  const distanceKm = haversineKm(
    buyerLatitude,
    buyerLongitude,
    listing.latitude,
    listing.longitude,
  )

  return { score: distanceKmToScore(distanceKm), distanceKm }
}

/** Text-based location signal when coordinates are unavailable. */
export function calculateLocationTextScore(
  preferredCity: string | null | undefined,
  preferredState: string | null | undefined,
  listing: WasteListing,
): number | null {
  const city = normalize(preferredCity)
  const state = normalize(preferredState)
  if (!city && !state) return null

  const listingCity = normalize(listing.city)
  const listingState = normalize(listing.state)
  let score = 0
  let parts = 0

  if (city) {
    parts += 1
    if (listingCity.includes(city) || city.includes(listingCity)) {
      score += 100
    }
  }

  if (state) {
    parts += 1
    if (listingState.includes(state) || state.includes(listingState)) {
      score += 100
    }
  }

  if (parts === 0) return null
  return Math.round(score / parts)
}

export function calculatePriceScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  if (!isPriceSpecified(requirement) || listing.asking_price == null) {
    return null
  }

  if (requirement.currency !== listing.currency) {
    return null
  }

  if (listing.price_unit && !isPriceUnitCompatible(listing.price_unit, requirement.quantity_unit)) {
    return null
  }

  const maxPrice = requirement.max_price!

  if (listing.asking_price <= maxPrice) {
    return 100
  }

  const ratio = maxPrice / listing.asking_price
  return Math.round(Math.max(0, Math.min(100, ratio * 100)))
}

export function calculateMarketplacePriceScore(
  maxPrice: number | null | undefined,
  listing: WasteListing,
): number | null {
  if (maxPrice == null || !Number.isFinite(maxPrice) || listing.asking_price == null) {
    return null
  }

  if (listing.asking_price <= maxPrice) return 100
  const ratio = maxPrice / listing.asking_price
  return Math.round(Math.max(0, Math.min(100, ratio * 100)))
}

export function calculateVerificationScore(listing: WasteListing): number {
  return listing.company?.verification_status === "verified" ? 100 : 40
}

export function calculateRecurringPreferenceScore(
  recurringFilter: "true" | "false" | undefined,
  listing: WasteListing,
): number | null {
  if (!recurringFilter) return null
  const wantsRecurring = recurringFilter === "true"
  return listing.recurring === wantsRecurring ? 100 : 35
}

/** Overall score uses all dimension weights; unspecified dimensions contribute 0 — never 100%. */
export function calculateOverallMatch(breakdown: MatchScoreBreakdown): number {
  const weighted =
    breakdown.material * MATCH_WEIGHTS.material +
    (breakdown.quantity ?? 0) * MATCH_WEIGHTS.quantity +
    (breakdown.quality ?? 0) * MATCH_WEIGHTS.quality +
    (breakdown.distance ?? 0) * MATCH_WEIGHTS.distance +
    (breakdown.price ?? 0) * MATCH_WEIGHTS.price

  const totalWeight =
    MATCH_WEIGHTS.material +
    MATCH_WEIGHTS.quantity +
    MATCH_WEIGHTS.quality +
    MATCH_WEIGHTS.distance +
    MATCH_WEIGHTS.price

  return Math.round(weighted / totalWeight)
}

export function buildMatchScoreBreakdown(
  requirement: BuyerRequirement,
  listing: WasteListing,
): { breakdown: MatchScoreBreakdown; overall: number; distanceKm: number | null } {
  const quantityNotSpecified = !isQuantitySpecified(requirement)
  const qualityNotSpecified = !isQualitySpecified(requirement)
  const priceNotSpecified = !isPriceSpecified(requirement)
  const distanceScoreable = isDistanceScoreable(requirement, listing)

  const material = calculateMaterialScore(requirement, listing)
  const quantity = calculateQuantityScore(requirement, listing)
  const quality = calculateQualityScore(requirement, listing)
  const distanceResult = calculateDistanceScore(requirement, listing)
  const price = calculatePriceScore(requirement, listing)

  const breakdown: MatchScoreBreakdown = {
    material,
    quantity,
    quality,
    distance: distanceResult.score,
    price,
    quantity_not_specified: quantityNotSpecified,
    quality_not_specified: qualityNotSpecified,
    price_not_specified: priceNotSpecified,
    quantity_unavailable: !quantityNotSpecified && quantity == null,
    distance_unavailable: !distanceScoreable,
    price_unavailable: !priceNotSpecified && price == null,
  }

  const overall = calculateOverallMatch(breakdown)

  return {
    breakdown,
    overall,
    distanceKm: distanceResult.distanceKm,
  }
}

export function hasMaterialRelevance(
  requirement: BuyerRequirement,
  listing: WasteListing,
): boolean {
  if (calculateMaterialScore(requirement, listing) > 0) return true

  const query = combineSearchQueries(requirement.material_name)
  if (!query) return false
  return scoreKeywordOverlap(query, listingMaterialHaystack(listing)).matchedCount > 0
}

export function marketplaceListingHasRelevance(
  searchText: string | null | undefined,
  categoryId: string | null | undefined,
  listing: WasteListing,
): boolean {
  if (categoryId && listing.category_id === categoryId) return true
  const query = combineSearchQueries(searchText)
  if (!query) return false
  return scoreKeywordOverlap(query, listingMaterialHaystack(listing)).matchedCount > 0
}
