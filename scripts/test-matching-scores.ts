/**
 * Matching score unit tests — run with: npx tsx scripts/test-matching-scores.ts
 */
import {
  buildMatchScoreBreakdown,
  calculateDistanceScore,
  calculateMaterialScore,
  calculatePriceScore,
  calculateQuantityScore,
} from "../lib/matching/scores"
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
    category_id: "cat-1",
    material_name: "HDPE",
    desired_grade: "A",
    quantity_needed: 1000,
    minimum_acceptable_quantity: 500,
    quantity_unit: "kg",
    max_price: 2.5,
    currency: "USD",
    preferred_quality: "clean",
    max_distance_km: 200,
    preferred_city: "Mumbai",
    preferred_state: "Maharashtra",
    preferred_country: "India",
    latitude: 19.076,
    longitude: 72.8777,
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
    category_id: "cat-1",
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

// Exact material match
const req = baseRequirement()
const listing = baseListing()
assert(calculateMaterialScore(req, listing) === 100, "exact material match scores 100")

// Category-only match (grade bonus applies when grades align)
assert(
  calculateMaterialScore(
    baseRequirement({ material_name: "PET bottles" }),
    baseListing({ material_name: "Mixed plastic", category_id: "cat-1" }),
  ) === 85,
  "same category + matching grade scores 85 when material differs",
)

// Quantity mismatch (unit)
assert(
  calculateQuantityScore(req, baseListing({ quantity_unit: "tonne" })) === null,
  "quantity score null when units differ",
)

// Quantity partial fulfillment
const partialQuantityScore = calculateQuantityScore(req, baseListing({ quantity: 750 }))
assert(
  partialQuantityScore != null && partialQuantityScore >= 60,
  "partial quantity yields mid-range score",
)

// Price mismatch (currency)
assert(
  calculatePriceScore(req, baseListing({ currency: "EUR" })) === null,
  "price score null when currency differs",
)

// Price within budget
assert(
  calculatePriceScore(req, baseListing({ asking_price: 2.0 })) === 100,
  "price within max scores 100",
)

// Price above budget
const aboveBudgetScore = calculatePriceScore(req, baseListing({ asking_price: 5.0 }))
assert(
  aboveBudgetScore != null && aboveBudgetScore < 100,
  "price above max scores below 100",
)

// Distance unavailable
const noCoords = calculateDistanceScore(
  baseRequirement({ latitude: null, longitude: null }),
  baseListing(),
)
assert(noCoords.score === null && noCoords.distanceKm === null, "distance unavailable without coordinates")

// Overall match for good pairing
const { overall, breakdown } = buildMatchScoreBreakdown(req, listing)
assert(overall >= 70, "strong pairing yields good overall score")
assert(breakdown.material === 100, "breakdown includes material score")
assert(breakdown.distance != null, "breakdown includes distance when coords present")

// Unrelated material yields low material score (grade-only overlap)
const weakMaterial = calculateMaterialScore(
  baseRequirement({ material_name: "Steel", category_id: "cat-other", desired_grade: null }),
  baseListing({ material_name: "HDPE", category_id: "cat-1", material_grade: null }),
)
assert(weakMaterial === 0, "unrelated material with no grade yields zero material score")

console.log("\nAll matching score tests completed.")
