import { AnalysisTimings } from "@/lib/ai/analysis-timings"
import { normalizeWasteAnalysisPayload } from "@/lib/ai/waste-analysis-normalize"
import { AiProviderError } from "@/lib/ai/provider"
import {
  buildWasteAnalysisUserPrompt,
  WASTE_ANALYSIS_SYSTEM_PROMPT,
} from "@/lib/ai/prompts"
import { callVisionJsonCompletionWithRetry } from "@/lib/ai/vision-retry"
import { wasteAnalysisSchema, type WasteAnalysisResult } from "@/lib/validations/ai"

export async function analyzeWasteImage(params: {
  imageBase64: string
  mimeType: string
  quantity: number
  quantityUnit: string
  sellerNote?: string
}): Promise<WasteAnalysisResult> {
  const timings = new AnalysisTimings()

  const userPrompt = buildWasteAnalysisUserPrompt({
    quantity: params.quantity,
    quantityUnit: params.quantityUnit,
    sellerNote: params.sellerNote,
  })
  timings.mark("request_creation")

  const raw = await callVisionJsonCompletionWithRetry({
    systemPrompt: WASTE_ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
    imageBase64: params.imageBase64,
    mimeType: params.mimeType,
  })
  timings.mark("gemini_request")

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new AiProviderError({
      kind: "validation_error",
      endpoint: "local/json",
      message: "AI returned invalid JSON",
      operation: "vision",
    })
  }
  timings.mark("response_parsing")

  parsed = normalizeWasteAnalysisPayload(parsed)

  const validated = wasteAnalysisSchema.safeParse(parsed)
  timings.mark("zod_validation")

  if (!validated.success) {
    if (process.env.NODE_ENV === "development") {
      const issue = validated.error.issues[0]
      const received = getValueAtPath(parsed, issue?.path)
      console.info("[AI analyze-waste validation]", {
        path: issue?.path.join(".") ?? "unknown",
        received:
          typeof received === "string" || typeof received === "number" || typeof received === "boolean"
            ? received
            : received === null
              ? null
              : typeof received,
        message: issue?.message ?? "invalid structure",
      })
    }

    throw new AiProviderError({
      kind: "validation_error",
      endpoint: "local/zod",
      message: `AI response validation failed: ${validated.error.issues[0]?.message ?? "invalid structure"}`,
      operation: "vision",
    })
  }

  timings.mark("total")
  timings.logDev({
    optimizedImageBytes: Math.round((params.imageBase64.length * 3) / 4),
    mimeType: params.mimeType,
  })

  return validated.data
}

function getValueAtPath(value: unknown, path: PropertyKey[] | undefined): unknown {
  if (!path?.length) return value
  let current: unknown = value
  for (const segment of path) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== "object") return undefined
    current = (current as Record<PropertyKey, unknown>)[segment]
  }
  return current
}
