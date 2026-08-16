/**
 * Match filter unit tests — run with: npx tsx scripts/test-match-filters.ts
 */
import {
  hasActiveMatchFilters,
  matchFiltersToSearchParams,
  matchPassesFilters,
  parseMatchFiltersFromSearchParams,
  type MatchForFiltering,
} from "../lib/matching/filters"
import type { BuyerRequirement, WasteListing } from "../lib/types"

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message)
    process.exitCode = 1
    throw new Error(message)
  }
  console.log("PASS:", message)
}

function baseRequirement(overrides: Partial<BuyerRequirement> = {}): BuyerRequirement {
  return {
    id: "req-1",
    buyer_company_id: "buyer-1",
    created_by: "user-1",
    title: "Test requirement",
    description: null,
    category_id: "11111111-1111-1111-1111-111111111111",
    material_name: "HDPE",
    desired_grade: "A",
    quantity_needed: 1000,
    minimum_acceptable_quantity: 500,
    quantity_unit: "kg",
    max_price: 2.5,
    currency: "USD",
    preferred_quality: "clean",
    max_distance_km: 200,
    preferred_city: "Chennai",
    preferred_state: "Tamil Nadu",
    preferred_country: "India",
    latitude: 13.0827,
    longitude: 80.2707,
    recurring: false,
    required_by: null,
    notes: null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function baseListing(overrides: Partial<WasteListing> = {}): WasteListing {
  return {
    id: "list-1",
    supplier_company_id: "sup-1",
    created_by: "user-2",
    title: "HDPE scrap",
    description: null,
    category_id: "11111111-1111-1111-1111-111111111111",
    material_name: "HDPE",
    material_grade: "A",
    quantity: 1200,
    quantity_unit: "kg",
    minimum_order_quantity: null,
    condition: "clean",
    contamination_level: "low",
    moisture_level: "dry",
    quality_notes: null,
    asking_price: 2.0,
    currency: "USD",
    price_unit: "per_kg",
    negotiable: true,
    recurring: false,
    availability_frequency: null,
    available_from: null,
    location_text: null,
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.5204,
    longitude: 73.8567,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function baseMatch(overrides: Partial<MatchForFiltering> = {}): MatchForFiltering {
  return {
    id: "match-1",
    requirement_id: "req-1",
    listing_id: "list-1",
    score: 85,
    score_breakdown: {
      material: 100,
      quantity: 100,
      quality: 90,
      distance: 70,
      price: 100,
      distance_unavailable: false,
      price_unavailable: false,
    },
    distance_km: 120,
    status: "suggested",
    created_at: new Date().toISOString(),
    requirement: baseRequirement(),
    listing: baseListing(),
    ...overrides,
  }
}

// Parser: lenient invalid numbers
const parsed = parseMatchFiltersFromSearchParams({
  material: "HDPE",
  minScore: "150",
  maxDistance: "-5",
  priceCompatibility: "compatible",
  city: "Chennai",
})
assert(parsed.material === "HDPE", "parses material")
assert(parsed.minScore === undefined, "rejects minScore above 100")
assert(parsed.maxDistance === undefined, "rejects negative maxDistance")
assert(parsed.priceCompatibility === "compatible", "parses priceCompatibility")
assert(parsed.city === "Chennai", "parses city")

// URL round-trip
const params = matchFiltersToSearchParams({
  material: "PET",
  minScore: 50,
  maxDistance: 200,
  priceCompatibility: "compatible",
  city: "Chennai",
  state: "Tamil Nadu",
})
assert(params.get("material") === "PET", "serializes material")
assert(params.get("minScore") === "50", "serializes minScore")
assert(params.get("priceCompatibility") === "compatible", "serializes priceCompatibility")
assert(params.get("state") === "Tamil Nadu", "serializes state")

// Filter logic
const match = baseMatch()
assert(matchPassesFilters(match, {}), "no filters passes all")
assert(matchPassesFilters(match, { material: "hdpe" }), "material filter case-insensitive")
assert(!matchPassesFilters(match, { material: "steel" }), "material filter excludes mismatch")
assert(matchPassesFilters(match, { minScore: 80 }), "minScore filter includes high score")
assert(!matchPassesFilters(match, { minScore: 90 }), "minScore filter excludes low score")
assert(matchPassesFilters(match, { city: "chennai" }), "city filter case-insensitive on requirement")
assert(!matchPassesFilters(match, { city: "delhi" }), "city filter excludes non-matching city")
assert(
  matchPassesFilters(match, {
    category: "11111111-1111-1111-1111-111111111111",
  }),
  "category filter by UUID",
)
assert(
  !matchPassesFilters(match, {
    category: "22222222-2222-2222-2222-222222222222",
  }),
  "category filter excludes other categories",
)
assert(matchPassesFilters(match, { maxDistance: 150 }), "maxDistance includes closer matches")
assert(!matchPassesFilters(match, { maxDistance: 100 }), "maxDistance excludes farther matches")
assert(
  matchPassesFilters(match, { priceCompatibility: "compatible" }),
  "price compatible filter includes compatible match",
)
assert(
  !matchPassesFilters(
    baseMatch({
      score_breakdown: {
        material: 100,
        quantity: 100,
        quality: 90,
        distance: 70,
        price: null,
        price_unavailable: true,
      },
    }),
    { priceCompatibility: "compatible" },
  ),
  "price compatible filter excludes unavailable price",
)
assert(
  matchPassesFilters(
    baseMatch({
      score_breakdown: {
        material: 100,
        quantity: 100,
        quality: 90,
        distance: 70,
        price: null,
        price_unavailable: true,
      },
    }),
    { priceCompatibility: "incompatible" },
  ),
  "price incompatible filter includes unavailable price",
)

assert(!hasActiveMatchFilters({}), "no active filters when empty")
assert(hasActiveMatchFilters({ material: "HDPE" }), "detects active material filter")

console.log("\nAll match filter tests completed.")
