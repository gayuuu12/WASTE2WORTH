import type { BuyerRequirement, WasteListing } from "@/lib/types"
import { normalizeSearchText } from "@/lib/matching/keywords"

function normalize(value: string | null | undefined) {
  return normalizeSearchText(value)
}

export function isQuantitySpecified(requirement: BuyerRequirement): boolean {
  return requirement.quantity_needed != null
}

export function isPriceSpecified(requirement: BuyerRequirement): boolean {
  return requirement.max_price != null
}

/** Empty or explicit "any" means the buyer did not state a quality preference. */
export function isQualitySpecified(requirement: BuyerRequirement): boolean {
  const preferred = normalize(requirement.preferred_quality)
  return Boolean(preferred && preferred !== "any")
}

export function isDistanceScoreable(
  requirement: BuyerRequirement,
  listing: WasteListing,
): boolean {
  return (
    requirement.latitude != null &&
    requirement.longitude != null &&
    listing.latitude != null &&
    listing.longitude != null
  )
}

export function countSpecifiedMatchDimensions(
  requirement: BuyerRequirement,
  listing: WasteListing,
): number {
  let count = 1 // material is always required on requirements
  if (isQuantitySpecified(requirement)) count += 1
  if (isQualitySpecified(requirement)) count += 1
  if (isDistanceScoreable(requirement, listing)) count += 1
  if (isPriceSpecified(requirement)) count += 1
  return count
}
