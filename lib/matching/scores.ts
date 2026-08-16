import { haversineKm } from "@/lib/format"
import { DEFAULT_MAX_DISTANCE_KM, MATCH_WEIGHTS } from "@/lib/matching/constants"
import type { BuyerRequirement, MatchScoreBreakdown, WasteListing } from "@/lib/types"

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
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

/** Material compatibility — exact match, category, partial name, grade adjustment */
export function calculateMaterialScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number {
  const reqMaterial = normalize(requirement.material_name)
  const listingMaterial = normalize(listing.material_name)

  let score = 0

  if (reqMaterial && listingMaterial && reqMaterial === listingMaterial) {
    score = 100
  } else if (
    reqMaterial &&
    listingMaterial &&
    (listingMaterial.includes(reqMaterial) || reqMaterial.includes(listingMaterial))
  ) {
    score = 60
  } else if (
    requirement.category_id &&
    listing.category_id &&
    requirement.category_id === listing.category_id
  ) {
    score = 70
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

/** Quantity compatibility — unit must match; compares needed, minimum, and available */
export function calculateQuantityScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  if (requirement.quantity_needed == null) return null
  if (requirement.quantity_unit !== listing.quantity_unit) return null

  const needed = requirement.quantity_needed
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

/** Quality compatibility — condition, grade, contamination vs buyer preference */
export function calculateQualityScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  const hasRequirementQuality = Boolean(requirement.preferred_quality?.trim())
  const hasListingQuality = Boolean(
    listing.condition || listing.contamination_level || listing.material_grade,
  )

  if (!hasRequirementQuality && !hasListingQuality) {
    return null
  }

  let score = 50

  const preferred = normalize(requirement.preferred_quality)
  const condition = normalize(listing.condition)
  const contamination = normalize(listing.contamination_level)

  if (preferred === "any") {
    score = 80
  } else if (preferred && condition) {
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

/** Straight-line distance score using Haversine — not driving distance */
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

  if (requirement.max_distance_km != null && distanceKm > requirement.max_distance_km) {
    return { score: 0, distanceKm }
  }

  const scoringCap = requirement.max_distance_km ?? DEFAULT_MAX_DISTANCE_KM
  const score = Math.round(Math.max(0, 100 - (distanceKm / scoringCap) * 100))

  return { score, distanceKm }
}

/** Price compatibility — requires matching currency and compatible price/quantity units */
export function calculatePriceScore(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number | null {
  if (requirement.max_price == null || listing.asking_price == null) {
    return null
  }

  if (requirement.currency !== listing.currency) {
    return null
  }

  if (listing.price_unit && !isPriceUnitCompatible(listing.price_unit, requirement.quantity_unit)) {
    return null
  }

  if (listing.asking_price <= requirement.max_price) {
    return 100
  }

  const ratio = requirement.max_price / listing.asking_price
  return Math.round(Math.max(0, Math.min(100, ratio * 100)))
}

export function calculateOverallMatch(breakdown: MatchScoreBreakdown): number {
  const components: Array<{ score: number; weight: number }> = [
    { score: breakdown.material, weight: MATCH_WEIGHTS.material },
  ]

  if (breakdown.quantity != null) {
    components.push({ score: breakdown.quantity, weight: MATCH_WEIGHTS.quantity })
  }
  if (breakdown.quality != null) {
    components.push({ score: breakdown.quality, weight: MATCH_WEIGHTS.quality })
  }
  if (breakdown.distance != null) {
    components.push({ score: breakdown.distance, weight: MATCH_WEIGHTS.distance })
  }
  if (breakdown.price != null) {
    components.push({ score: breakdown.price, weight: MATCH_WEIGHTS.price })
  }

  const totalWeight = components.reduce((sum, part) => sum + part.weight, 0)
  const weightedScore = components.reduce((sum, part) => sum + part.score * part.weight, 0)

  return Math.round(weightedScore / totalWeight)
}

export function buildMatchScoreBreakdown(
  requirement: BuyerRequirement,
  listing: WasteListing,
): { breakdown: MatchScoreBreakdown; overall: number; distanceKm: number | null } {
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
    distance_unavailable: distanceResult.score == null,
    price_unavailable: price == null,
  }

  const overall = calculateOverallMatch(breakdown)

  return {
    breakdown,
    overall,
    distanceKm: distanceResult.distanceKm,
  }
}
