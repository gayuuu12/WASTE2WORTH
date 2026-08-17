export const MATERIAL_OUTCOME_TYPES = [
  "reused_directly",
  "repaired",
  "refurbished",
  "remanufactured",
  "recycled",
  "composted",
  "energy_recovery",
  "other",
] as const

export type MaterialOutcomeType = (typeof MATERIAL_OUTCOME_TYPES)[number]

export const MATERIAL_OUTCOME_LABELS: Record<MaterialOutcomeType, string> = {
  reused_directly: "Direct reuse",
  repaired: "Repaired",
  refurbished: "Refurbished",
  remanufactured: "Remanufactured",
  recycled: "Recycled",
  composted: "Composted",
  energy_recovery: "Energy recovery",
  other: "Other",
}

export const VERIFICATION_STATUS_LABELS = {
  buyer_reported: "Buyer reported",
  supplier_confirmed: "Supplier confirmed",
  verified: "Verified",
} as const

export type ImpactPeriod = "this_month" | "last_3_months" | "last_6_months" | "this_year" | "all_time"

export const IMPACT_PERIOD_LABELS: Record<ImpactPeriod, string> = {
  this_month: "This month",
  last_3_months: "Last 3 months",
  last_6_months: "Last 6 months",
  this_year: "This year",
  all_time: "All time",
}

export const IMPACT_TREND_MONTHS: Record<"6" | "12" | "all", number | null> = {
  "6": 6,
  "12": 12,
  all: null,
}
