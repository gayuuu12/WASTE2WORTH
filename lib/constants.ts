export const QUANTITY_UNITS = ["kg", "tonne", "litre", "m3", "unit", "pallet", "roll"] as const

export const CONDITIONS = [
  "clean",
  "lightly-soiled",
  "contaminated",
  "mixed",
  "sorted",
  "unsorted",
] as const

export const CONTAMINATION_LEVELS = ["none", "low", "medium", "high"] as const

export const MOISTURE_LEVELS = ["dry", "low", "medium", "high", "wet"] as const

export const AVAILABILITY_FREQUENCIES = [
  "one-time",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
] as const

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const

export const PRICE_UNITS = ["per_kg", "per_tonne", "per_unit", "lot"] as const

export const BUSINESS_TYPES = [
  "Private Limited",
  "Public Limited",
  "Partnership",
  "Sole Proprietorship",
  "LLP",
  "Cooperative",
  "Government",
  "Other",
] as const

export const COMPANY_ROLES = [
  { value: "supplier", label: "Supplier" },
  { value: "buyer", label: "Buyer" },
  { value: "both", label: "Both" },
] as const

export const INDUSTRIES = [
  "Manufacturing",
  "Textile & Apparel",
  "Food & Beverage",
  "Automotive",
  "Construction",
  "Packaging",
  "Electronics",
  "Chemical",
  "Agriculture",
  "Recycling & Waste Management",
  "Logistics",
  "Other",
] as const

// Rough CO2 savings factor (kg CO2e saved per kg diverted from landfill / virgin production)
export const CO2_FACTOR_BY_CATEGORY: Record<string, number> = {
  plastics: 1.9,
  metals: 4.5,
  "paper-cardboard": 1.1,
  textiles: 3.2,
  organic: 0.6,
  glass: 0.3,
  wood: 0.8,
  rubber: 2.1,
  chemicals: 2.5,
  electronics: 5.0,
  construction: 0.4,
  other: 1.0,
}

export const DEFAULT_CO2_FACTOR = 1.0
