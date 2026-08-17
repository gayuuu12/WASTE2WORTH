import { z } from "zod"
import {
  RECOMMENDATION_ACTIONS,
  REUSE_PRIORITIES,
  REUSE_SUITABILITY_LEVELS,
} from "@/lib/ai/waste-analysis-enums"
import {
  CONDITIONS,
  CONTAMINATION_LEVELS,
  MOISTURE_LEVELS,
} from "@/lib/constants"
import { CANONICAL_WASTE_CATEGORY_SLUGS } from "@/lib/listings/constants"

export const reuseOpportunitySchema = z.object({
  use: z.string().min(1),
  reason: z.string().min(1),
  suitability: z.enum(REUSE_SUITABILITY_LEVELS),
  limitations: z.string().min(1),
})

export const wasteAnalysisSchema = z.object({
  category: z.enum(CANONICAL_WASTE_CATEGORY_SLUGS as unknown as [string, ...string[]]),
  material_name: z.string().min(1).max(200),
  material_grade: z.string().max(100).nullable(),
  title: z.string().min(3).max(200),
  description: z.string().max(5000),
  condition: z.enum(CONDITIONS),
  contamination_level: z.enum(CONTAMINATION_LEVELS),
  moisture_level: z.enum(MOISTURE_LEVELS),
  quality_notes: z.string().max(2000),
  possible_uses: z.array(reuseOpportunitySchema).min(1).max(8),
  reuse_priority: z.enum(REUSE_PRIORITIES),
  confidence: z.number().min(0).max(100),
  explanation: z.array(z.string().min(1)).min(1).max(8),
  uncertainty: z.string().min(1).max(1000),
  recommendation: z.object({
    action: z.enum(RECOMMENDATION_ACTIONS),
    summary: z.string().min(1).max(500),
  }),
  requires_manual_confirmation: z.boolean(),
})

export type WasteAnalysisResult = z.infer<typeof wasteAnalysisSchema>
export type ReuseOpportunity = z.infer<typeof reuseOpportunitySchema>

export const analyzeWasteRequestSchema = z.object({
  quantity: z.number().positive(),
  quantityUnit: z.string().min(1).max(20),
  sellerNote: z.string().max(1000).optional(),
})

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
})

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  pageContext: z.string().max(200).optional(),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
