import {
  CONDITIONS,
  CONTAMINATION_LEVELS,
  MOISTURE_LEVELS,
} from "@/lib/constants"
import { normalizeWasteCategorySlug } from "@/lib/ai/category-normalize"
import {
  RECOMMENDATION_ACTIONS,
  REUSE_PRIORITIES,
  REUSE_SUITABILITY_LEVELS,
} from "@/lib/ai/waste-analysis-enums"

type AllowedValues = readonly string[]

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function normalizeSlugToken(value: string): string {
  return normalizeToken(value).replace(/\s+/g, "-").replace(/_+/g, "-")
}

function normalizeUnderscoreToken(value: string): string {
  return normalizeToken(value).replace(/[\s-]+/g, "_")
}

function pickAllowed(
  value: unknown,
  allowed: AllowedValues,
  aliases: Record<string, string>,
): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null
  }

  const candidates = [
    normalizeToken(String(value)),
    normalizeSlugToken(String(value)),
    normalizeUnderscoreToken(String(value)),
  ]

  for (const candidate of candidates) {
    if ((allowed as readonly string[]).includes(candidate)) {
      return candidate
    }
    if (aliases[candidate]) {
      return aliases[candidate]
    }
  }

  return null
}

const CONDITION_ALIASES: Record<string, string> = {
  clean: "clean",
  "lightly soiled": "lightly-soiled",
  "light soiling": "lightly-soiled",
  "lightly-soiled": "lightly-soiled",
  soiled: "lightly-soiled",
  dirty: "lightly-soiled",
  contaminated: "contaminated",
  mixed: "mixed",
  sorted: "sorted",
  unsorted: "unsorted",
}

const CONTAMINATION_ALIASES: Record<string, string> = {
  none: "none",
  "no contamination": "none",
  zero: "none",
  negligible: "none",
  low: "low",
  minimal: "low",
  medium: "medium",
  moderate: "medium",
  mid: "medium",
  high: "high",
  severe: "high",
  heavy: "high",
}

const MOISTURE_ALIASES: Record<string, string> = {
  dry: "dry",
  none: "dry",
  low: "low",
  medium: "medium",
  moderate: "medium",
  high: "high",
  wet: "wet",
  damp: "wet",
  moist: "wet",
  saturated: "wet",
}

const SUITABILITY_ALIASES: Record<string, string> = {
  high: "high",
  good: "high",
  strong: "high",
  excellent: "high",
  medium: "medium",
  moderate: "medium",
  mid: "medium",
  average: "medium",
  fair: "medium",
  low: "low",
  poor: "low",
  limited: "low",
  weak: "low",
}

const REUSE_PRIORITY_ALIASES: Record<string, string> = {
  direct_reuse: "direct_reuse",
  "direct reuse": "direct_reuse",
  reuse: "direct_reuse",
  recycle: "recycle",
  recycling: "recycle",
  mixed: "mixed",
  inspection_required: "inspection_required",
  "inspection required": "inspection_required",
  inspect: "inspection_required",
  inspection: "inspection_required",
}

const RECOMMENDATION_ALIASES: Record<string, string> = {
  sell_directly: "sell_directly",
  "sell directly": "sell_directly",
  sell: "sell_directly",
  reuse: "reuse",
  recycle: "recycle",
  further_inspection: "further_inspection",
  "further inspection": "further_inspection",
  inspection: "further_inspection",
  inspect: "further_inspection",
}

export function normalizeConfidence(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const scaled = value > 0 && value <= 1 ? value * 100 : value
    return Math.round(Math.min(100, Math.max(0, scaled)))
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    const percentMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%?$/)
    if (percentMatch) {
      const parsed = Number(percentMatch[1])
      if (Number.isFinite(parsed)) {
        const scaled = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed
        return Math.round(Math.min(100, Math.max(0, scaled)))
      }
    }
  }

  return null
}

function normalizePossibleUses(raw: unknown): unknown {
  if (!Array.isArray(raw)) {
    return raw
  }

  return raw.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry
    }

    const use = { ...(entry as Record<string, unknown>) }
    const suitability = pickAllowed(
      use.suitability,
      REUSE_SUITABILITY_LEVELS,
      SUITABILITY_ALIASES,
    )
    if (suitability) {
      use.suitability = suitability
    }

    return use
  })
}

function normalizeRecommendation(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw
  }

  const recommendation = { ...(raw as Record<string, unknown>) }
  const action = pickAllowed(
    recommendation.action,
    RECOMMENDATION_ACTIONS,
    RECOMMENDATION_ALIASES,
  )
  if (action) {
    recommendation.action = action
  }

  return recommendation
}

export function normalizeWasteAnalysisPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw
  }

  const payload = { ...(raw as Record<string, unknown>) }

  if (typeof payload.category === "string") {
    const slug = normalizeWasteCategorySlug(payload.category)
    if (slug) {
      payload.category = slug
    }
  }

  const condition = pickAllowed(payload.condition, CONDITIONS, CONDITION_ALIASES)
  if (condition) payload.condition = condition

  const contamination = pickAllowed(
    payload.contamination_level,
    CONTAMINATION_LEVELS,
    CONTAMINATION_ALIASES,
  )
  if (contamination) payload.contamination_level = contamination

  const moisture = pickAllowed(
    payload.moisture_level,
    MOISTURE_LEVELS,
    MOISTURE_ALIASES,
  )
  if (moisture) payload.moisture_level = moisture

  const reusePriority = pickAllowed(
    payload.reuse_priority,
    REUSE_PRIORITIES,
    REUSE_PRIORITY_ALIASES,
  )
  if (reusePriority) payload.reuse_priority = reusePriority

  const confidence = normalizeConfidence(payload.confidence)
  if (confidence !== null) {
    payload.confidence = confidence
  }

  payload.possible_uses = normalizePossibleUses(payload.possible_uses)
  payload.recommendation = normalizeRecommendation(payload.recommendation)

  if (payload.requires_manual_confirmation !== true && typeof payload.confidence === "number") {
    if (payload.confidence < 80) {
      payload.requires_manual_confirmation = true
    }
  }

  return payload
}
