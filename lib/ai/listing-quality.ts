export type ListingQualityRating = "excellent" | "good" | "needs_attention"

export interface ListingQualityInput {
  title?: string
  materialName?: string
  quantity?: number
  askingPrice?: number | null
  city?: string
  state?: string
  country?: string
  description?: string
  hasImage?: boolean
}

export interface ListingQualityResult {
  rating: ListingQualityRating
  score: number
  missing: string[]
  message: string
}

export function computeListingQuality(input: ListingQualityInput): ListingQualityResult {
  const missing: string[] = []
  let score = 0

  if (input.title?.trim()) score += 15
  else missing.push("title")

  if (input.materialName?.trim()) score += 15
  else missing.push("material name")

  if (input.quantity && input.quantity > 0) score += 15
  else missing.push("quantity")

  if (input.askingPrice != null && input.askingPrice >= 0) score += 20
  else missing.push("asking price")

  if (input.city?.trim() && input.state?.trim() && input.country?.trim()) score += 15
  else missing.push("location")

  if (input.hasImage) score += 10
  else missing.push("image")

  if (input.description?.trim() && input.description.trim().length >= 20) score += 10
  else missing.push("description")

  let rating: ListingQualityRating = "needs_attention"
  if (score >= 90) rating = "excellent"
  else if (score >= 70) rating = "good"

  const message =
    missing.length === 0
      ? "Your listing looks complete and ready to publish."
      : `Your listing is almost ready. Please add: ${missing.join(", ")}.`

  return { rating, score, missing, message }
}

export function getQualityLabel(rating: ListingQualityRating) {
  switch (rating) {
    case "excellent":
      return "Excellent"
    case "good":
      return "Good"
    case "needs_attention":
      return "Needs Attention"
  }
}
