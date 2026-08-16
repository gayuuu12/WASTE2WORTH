import { z } from "zod"
import type { BuyerRequirement, Match, MatchScoreBreakdown, WasteListing } from "@/lib/types"

export type MatchForFiltering = Match & {
  requirement: BuyerRequirement
  listing: WasteListing
}

export type PriceCompatibilityFilter = "any" | "compatible" | "incompatible"

export type ParsedMatchFilters = {
  material?: string
  category?: string
  minScore?: number
  maxDistance?: number
  priceCompatibility?: PriceCompatibilityFilter
  city?: string
  state?: string
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

/** Parse URL search params leniently — invalid fields are ignored, not fatal. */
export function parseMatchFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ParsedMatchFilters {
  const filters: ParsedMatchFilters = {}

  const material = readParam(params, "material")?.trim()
  if (material) filters.material = material

  const category = readParam(params, "category")?.trim()
  if (category && z.string().uuid().safeParse(category).success) {
    filters.category = category
  }

  const minScoreRaw = readParam(params, "minScore")?.trim()
  if (minScoreRaw) {
    const minScore = Number(minScoreRaw)
    if (Number.isFinite(minScore) && minScore >= 0 && minScore <= 100) {
      filters.minScore = minScore
    }
  }

  const maxDistanceRaw = readParam(params, "maxDistance")?.trim()
  if (maxDistanceRaw) {
    const maxDistance = Number(maxDistanceRaw)
    if (Number.isFinite(maxDistance) && maxDistance >= 0) {
      filters.maxDistance = maxDistance
    }
  }

  const priceRaw = (
    readParam(params, "priceCompatibility") ?? readParam(params, "priceCompatible")
  )
    ?.trim()
    .toLowerCase()

  if (priceRaw === "compatible" || priceRaw === "true") {
    filters.priceCompatibility = "compatible"
  } else if (priceRaw === "incompatible" || priceRaw === "false") {
    filters.priceCompatibility = "incompatible"
  }

  const city = readParam(params, "city")?.trim()
  if (city) filters.city = city

  const state = readParam(params, "state")?.trim()
  if (state) filters.state = state

  return filters
}

export function matchFiltersToSearchParams(filters: ParsedMatchFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.material) params.set("material", filters.material)
  if (filters.category) params.set("category", filters.category)
  if (filters.minScore != null) params.set("minScore", String(filters.minScore))
  if (filters.maxDistance != null) params.set("maxDistance", String(filters.maxDistance))
  if (filters.priceCompatibility && filters.priceCompatibility !== "any") {
    params.set("priceCompatibility", filters.priceCompatibility)
  }
  if (filters.city) params.set("city", filters.city)
  if (filters.state) params.set("state", filters.state)

  return params
}

export function serializeMatchFilters(filters: ParsedMatchFilters): string {
  return matchFiltersToSearchParams(filters).toString()
}

export function hasActiveMatchFilters(filters: ParsedMatchFilters): boolean {
  return Boolean(
    filters.material ||
      filters.category ||
      filters.minScore != null ||
      filters.maxDistance != null ||
      (filters.priceCompatibility && filters.priceCompatibility !== "any") ||
      filters.city ||
      filters.state,
  )
}

export function matchPassesFilters(match: MatchForFiltering, filters: ParsedMatchFilters): boolean {
  const listing = match.listing
  const requirement = match.requirement
  const breakdown = (match.score_breakdown ?? {}) as MatchScoreBreakdown

  if (filters.material) {
    const needle = filters.material.toLowerCase()
    const requirementMaterial = requirement.material_name.toLowerCase()
    const listingMaterial = listing.material_name.toLowerCase()
    if (!requirementMaterial.includes(needle) && !listingMaterial.includes(needle)) {
      return false
    }
  }

  if (filters.category) {
    if (
      requirement.category_id !== filters.category &&
      listing.category_id !== filters.category
    ) {
      return false
    }
  }

  if (filters.minScore != null && match.score < filters.minScore) {
    return false
  }

  if (filters.maxDistance != null) {
    if (match.distance_km == null || match.distance_km > filters.maxDistance) {
      return false
    }
  }

  if (filters.priceCompatibility === "compatible") {
    if (breakdown.price_unavailable || breakdown.price == null) return false
  }

  if (filters.priceCompatibility === "incompatible") {
    if (!breakdown.price_unavailable) return false
  }

  if (filters.city) {
    const city = filters.city.toLowerCase()
    const listingCity = listing.city?.toLowerCase() ?? ""
    const requirementCity = requirement.preferred_city?.toLowerCase() ?? ""
    if (!listingCity.includes(city) && !requirementCity.includes(city)) {
      return false
    }
  }

  if (filters.state) {
    const state = filters.state.toLowerCase()
    const listingState = listing.state?.toLowerCase() ?? ""
    const requirementState = requirement.preferred_state?.toLowerCase() ?? ""
    if (!listingState.includes(state) && !requirementState.includes(state)) {
      return false
    }
  }

  return true
}
