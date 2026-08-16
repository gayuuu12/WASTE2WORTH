export const MATCH_WEIGHTS = {
  material: 0.35,
  quantity: 0.2,
  quality: 0.15,
  distance: 0.15,
  price: 0.15,
} as const

export const MATCH_STORE_MIN_SCORE = 25

export const MATCH_TIERS = [
  { min: 85, label: "Excellent Match", variant: "default" as const },
  { min: 70, label: "Good Match", variant: "secondary" as const },
  { min: 50, label: "Possible Match", variant: "outline" as const },
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
