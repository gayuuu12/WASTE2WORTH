import { combineSearchQueries } from "@/lib/matching/keywords"
import {
  MARKETPLACE_STRONG_MATCH_MIN,
  MARKETPLACE_WEAK_MATCH_MIN,
  MARKETPLACE_WEIGHTS,
} from "@/lib/matching/constants"
import {
  calculateDistanceScoreFromCoords,
  calculateLocationTextScore,
  calculateMarketplaceMaterialScore,
  calculateMarketplacePriceScore,
  calculateMarketplaceQuantityScore,
  calculateRecurringPreferenceScore,
  calculateVerificationScore,
  marketplaceListingHasRelevance,
} from "@/lib/matching/scores"
import type { WasteListing } from "@/lib/types"
import type { MarketplaceFilters } from "@/lib/validations/listings"

export interface MarketplaceSearchContext {
  filters: MarketplaceFilters
  buyerLatitude?: number | null
  buyerLongitude?: number | null
}

export interface MarketplaceRecommendation {
  listing: WasteListing
  score: number
  distanceKm: number | null
  isStrongMatch: boolean
  isWeakMatch: boolean
}

export interface RankedMarketplaceResults {
  strong: MarketplaceRecommendation[]
  alternatives: MarketplaceRecommendation[]
  hasActiveFilters: boolean
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

export function hasActiveMarketplaceFilters(filters: MarketplaceFilters): boolean {
  return Boolean(
    filters.q?.trim() ||
      filters.material?.trim() ||
      filters.category?.trim() ||
      filters.city?.trim() ||
      filters.state?.trim() ||
      filters.minQuantity?.trim() ||
      filters.maxPrice?.trim() ||
      filters.recurring ||
      filters.verified,
  )
}

function weightedAverage(components: Array<{ score: number; weight: number }>): number {
  if (components.length === 0) return 0
  const totalWeight = components.reduce((sum, part) => sum + part.weight, 0)
  const weighted = components.reduce((sum, part) => sum + part.score * part.weight, 0)
  return Math.round(weighted / totalWeight)
}

export function scoreMarketplaceListing(
  listing: WasteListing,
  context: MarketplaceSearchContext,
): { score: number; distanceKm: number | null } {
  const { filters } = context
  const searchText = combineSearchQueries(filters.q, filters.material)
  const minQuantity = parseOptionalNumber(filters.minQuantity)
  const maxPrice = parseOptionalNumber(filters.maxPrice)

  const material = calculateMarketplaceMaterialScore(
    searchText,
    listing,
    filters.category?.trim() || null,
  )
  const quantity = calculateMarketplaceQuantityScore(minQuantity, listing)
  const price = calculateMarketplacePriceScore(maxPrice, listing)

  let distanceKm: number | null = null
  let distanceScore: number | null = null

  if (context.buyerLatitude != null && context.buyerLongitude != null) {
    const distanceResult = calculateDistanceScoreFromCoords(
      context.buyerLatitude,
      context.buyerLongitude,
      listing,
    )
    distanceKm = distanceResult.distanceKm
    distanceScore = distanceResult.score
  }

  const locationTextScore = calculateLocationTextScore(filters.city, filters.state, listing)

  const verification = calculateVerificationScore(listing)
  const recurring = calculateRecurringPreferenceScore(filters.recurring, listing)

  const components: Array<{ score: number; weight: number }> = [
    { score: material, weight: MARKETPLACE_WEIGHTS.material },
  ]

  if (quantity != null) {
    components.push({ score: quantity, weight: MARKETPLACE_WEIGHTS.quantity })
  }
  if (price != null) {
    components.push({ score: price, weight: MARKETPLACE_WEIGHTS.price })
  }
  if (distanceScore != null) {
    components.push({ score: distanceScore, weight: MARKETPLACE_WEIGHTS.distance })
  } else if (locationTextScore != null) {
    components.push({ score: locationTextScore, weight: MARKETPLACE_WEIGHTS.location })
  }
  if (filters.verified === "true") {
    components.push({ score: verification, weight: MARKETPLACE_WEIGHTS.verification })
  }
  if (recurring != null) {
    components.push({ score: recurring, weight: MARKETPLACE_WEIGHTS.recurring })
  }

  return {
    score: weightedAverage(components),
    distanceKm,
  }
}

function compareRecommendations(a: MarketplaceRecommendation, b: MarketplaceRecommendation) {
  if (b.score !== a.score) return b.score - a.score

  const distA = a.distanceKm ?? Number.POSITIVE_INFINITY
  const distB = b.distanceKm ?? Number.POSITIVE_INFINITY
  if (distA !== distB) return distA - distB

  const priceA = a.listing.asking_price ?? Number.POSITIVE_INFINITY
  const priceB = b.listing.asking_price ?? Number.POSITIVE_INFINITY
  if (priceA !== priceB) return priceA - priceB

  const verifiedA = a.listing.company?.verification_status === "verified" ? 1 : 0
  const verifiedB = b.listing.company?.verification_status === "verified" ? 1 : 0
  if (verifiedB !== verifiedA) return verifiedB - verifiedA

  return new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime()
}

export function rankMarketplaceListings(
  listings: WasteListing[],
  context: MarketplaceSearchContext,
): RankedMarketplaceResults {
  const hasActiveFilters = hasActiveMarketplaceFilters(context.filters)

  if (!hasActiveFilters) {
    const sorted = [...listings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return {
      strong: sorted.map((listing) => ({
        listing,
        score: 0,
        distanceKm: null,
        isStrongMatch: true,
        isWeakMatch: false,
      })),
      alternatives: [],
      hasActiveFilters: false,
    }
  }

  const searchText = combineSearchQueries(context.filters.q, context.filters.material)
  const categoryId = context.filters.category?.trim() || null

  const recommendations = listings
    .map((listing) => {
      const { score, distanceKm } = scoreMarketplaceListing(listing, context)
      return {
        listing,
        score,
        distanceKm,
        isStrongMatch: score >= MARKETPLACE_STRONG_MATCH_MIN,
        isWeakMatch: score >= MARKETPLACE_WEAK_MATCH_MIN && score < MARKETPLACE_STRONG_MATCH_MIN,
      }
    })
    .filter(
      (item) =>
        item.score >= MARKETPLACE_WEAK_MATCH_MIN ||
        marketplaceListingHasRelevance(searchText, categoryId, item.listing),
    )
    .sort(compareRecommendations)

  const strong = recommendations.filter((item) => item.isStrongMatch)
  const alternatives = recommendations.filter((item) => !item.isStrongMatch)

  return {
    strong,
    alternatives,
    hasActiveFilters: true,
  }
}
