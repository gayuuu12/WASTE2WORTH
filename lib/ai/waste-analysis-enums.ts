import {
  CONDITIONS,
  CONTAMINATION_LEVELS,
  MOISTURE_LEVELS,
} from "@/lib/constants"
import { CANONICAL_WASTE_CATEGORY_SLUGS } from "@/lib/listings/constants"

/** Reuse opportunity suitability — must match reuseOpportunitySchema. */
export const REUSE_SUITABILITY_LEVELS = ["high", "medium", "low"] as const

export type ReuseSuitabilityLevel = (typeof REUSE_SUITABILITY_LEVELS)[number]

/** Reuse priority — must match wasteAnalysisSchema.reuse_priority. */
export const REUSE_PRIORITIES = [
  "direct_reuse",
  "recycle",
  "mixed",
  "inspection_required",
] as const

export type ReusePriority = (typeof REUSE_PRIORITIES)[number]

/** Recommendation action — must match wasteAnalysisSchema.recommendation.action. */
export const RECOMMENDATION_ACTIONS = [
  "sell_directly",
  "reuse",
  "recycle",
  "further_inspection",
] as const

export type RecommendationAction = (typeof RECOMMENDATION_ACTIONS)[number]

const STRING_ENUM = (values: readonly string[]) => ({
  type: "STRING" as const,
  enum: [...values],
})

/** Gemini OpenAPI responseSchema — enum values mirror Zod exactly. */
export const GEMINI_WASTE_ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "category",
    "material_name",
    "material_grade",
    "title",
    "description",
    "condition",
    "contamination_level",
    "moisture_level",
    "quality_notes",
    "possible_uses",
    "reuse_priority",
    "confidence",
    "explanation",
    "uncertainty",
    "recommendation",
    "requires_manual_confirmation",
  ],
  properties: {
    category: STRING_ENUM(CANONICAL_WASTE_CATEGORY_SLUGS),
    material_name: { type: "STRING" },
    material_grade: { type: "STRING", nullable: true },
    title: { type: "STRING" },
    description: { type: "STRING" },
    condition: STRING_ENUM(CONDITIONS),
    contamination_level: STRING_ENUM(CONTAMINATION_LEVELS),
    moisture_level: STRING_ENUM(MOISTURE_LEVELS),
    quality_notes: { type: "STRING" },
    possible_uses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["use", "reason", "suitability", "limitations"],
        properties: {
          use: { type: "STRING" },
          reason: { type: "STRING" },
          suitability: STRING_ENUM(REUSE_SUITABILITY_LEVELS),
          limitations: { type: "STRING" },
        },
      },
    },
    reuse_priority: STRING_ENUM(REUSE_PRIORITIES),
    confidence: { type: "INTEGER", minimum: 0, maximum: 100 },
    explanation: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    uncertainty: { type: "STRING" },
    recommendation: {
      type: "OBJECT",
      required: ["action", "summary"],
      properties: {
        action: STRING_ENUM(RECOMMENDATION_ACTIONS),
        summary: { type: "STRING" },
      },
    },
    requires_manual_confirmation: { type: "BOOLEAN" },
  },
} as const
