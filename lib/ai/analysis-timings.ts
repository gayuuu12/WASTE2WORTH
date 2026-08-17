import type { AiErrorKind, AiProviderError } from "@/lib/ai/errors"

export type AnalysisTimingStage =
  | "image_preparation"
  | "request_creation"
  | "gemini_request"
  | "response_parsing"
  | "zod_validation"
  | "total"

const STAGE_ORDER: AnalysisTimingStage[] = [
  "image_preparation",
  "request_creation",
  "gemini_request",
  "response_parsing",
  "zod_validation",
  "total",
]

export class AnalysisTimings {
  private readonly startedAt = Date.now()
  private readonly marks = new Map<AnalysisTimingStage, number>()

  mark(stage: AnalysisTimingStage) {
    this.marks.set(stage, Date.now())
  }

  logDev(extra?: Record<string, string | number | boolean | null | undefined>) {
    if (process.env.NODE_ENV !== "development") return

    const stageDurations: Record<string, number | null> = {}
    let previous = this.startedAt

    for (const stage of STAGE_ORDER) {
      const timestamp = this.marks.get(stage)
      if (timestamp !== undefined) {
        stageDurations[`${stage}Ms`] = timestamp - previous
        previous = timestamp
      } else {
        stageDurations[`${stage}Ms`] = null
      }
    }

    console.info("[AI analyze-waste timings]", {
      ...stageDurations,
      totalMs: Date.now() - this.startedAt,
      ...extra,
    })
  }
}

/** User-facing hint: timeout and transient provider failures are retryable in the UI. */
export function isTransientVisionError(error: AiProviderError): boolean {
  if (error.kind === "rate_limit" || error.kind === "insufficient_quota") return false
  if (error.kind === "invalid_api_key" || error.kind === "model_error") return false
  if (error.kind === "invalid_request" || error.kind === "validation_error") return false
  if (error.kind === "not_configured") return false

  if (error.kind === "timeout") return true

  if (error.providerType?.toUpperCase() === "UNAVAILABLE") return true

  if (error.kind === "provider_error") {
    const status = error.httpStatus ?? 0
    return status >= 500 || status === 503
  }

  if (error.kind === "unknown" && (!error.httpStatus || error.httpStatus === 0)) {
    return true
  }

  return false
}

/** Server-side auto-retry: only fast-failing capacity errors — never client timeouts. */
export function isRetryableVisionError(error: AiProviderError): boolean {
  if (error.kind === "timeout") return false
  if (error.kind === "rate_limit" || error.kind === "insufficient_quota") return false
  if (error.kind === "invalid_api_key" || error.kind === "model_error") return false
  if (error.kind === "invalid_request" || error.kind === "validation_error") return false
  if (error.kind === "not_configured") return false

  if (error.providerType?.toUpperCase() === "UNAVAILABLE") return true
  if (error.httpStatus === 503) return true

  return false
}

export function isRetryableAnalysisError(kind: AiErrorKind): boolean {
  return (
    kind === "timeout" ||
    kind === "provider_error" ||
    kind === "unknown" ||
    kind === "empty_response"
  )
}

export function analysisErrorHint(kind: AiErrorKind): "temporary_service" | undefined {
  if (
    kind === "timeout" ||
    kind === "provider_error" ||
    kind === "unknown" ||
    kind === "empty_response"
  ) {
    return "temporary_service"
  }
  return undefined
}
