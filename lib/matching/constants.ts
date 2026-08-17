export const MATCH_WEIGHTS = {
  material: 0.35,
  quantity: 0.2,
  quality: 0.15,
  distance: 0.15,
  price: 0.15,
} as const

export const MARKETPLACE_WEIGHTS = {
  material: 0.35,
  quantity: 0.15,
  price: 0.15,
  distance: 0.15,
  location: 0.1,
  verification: 0.05,
  recurring: 0.05,
} as const

/** Geographic distance tiers for match / marketplace ranking (Haversine km). */
export const DISTANCE_SCORE_TIERS = [
  { maxKm: 25, score: 100, label: "Excellent location match" },
  { maxKm: 50, score: 85, label: "Very good" },
  { maxKm: 100, score: 70, label: "Good" },
  { maxKm: 200, score: 50, label: "Moderate" },
  { maxKm: 500, score: 25, label: "Low" },
  { maxKm: Number.POSITIVE_INFINITY, score: 10, label: "Very low" },
] as const

export const MATCH_STORE_MIN_SCORE = 25

export const MARKETPLACE_STRONG_MATCH_MIN = 50
export const MARKETPLACE_WEAK_MATCH_MIN = 15

export const MATCH_TIERS = [
  { min: 85, label: "Excellent Match", variant: "default" as const },
  { min: 75, label: "Strong Match", variant: "secondary" as const },
  { min: 60, label: "Good Match", variant: "secondary" as const },
  { min: 40, label: "Possible Match", variant: "outline" as const },
  { min: 0, label: "Low Match", variant: "outline" as const },
]

export const PREFERRED_QUALITY_OPTIONS = [
  "clean",
  "sorted",
  "lightly-soiled",
  "mixed",
  "low-contamination",
  "dry",
  "any",
] as const

export const DEFAULT_MAX_DISTANCE_KM = 500

export function getMatchTier(score: number) {
  return MATCH_TIERS.find((tier) => score >= tier.min) ?? MATCH_TIERS[MATCH_TIERS.length - 1]
}
