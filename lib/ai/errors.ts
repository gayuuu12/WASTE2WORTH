import type { AiProviderName } from "@/lib/ai/types"

export class AiProviderError extends Error {
  readonly kind: AiErrorKind
  readonly statusCode: number
  readonly httpStatus?: number
  readonly provider?: AiProviderName
  readonly providerType?: string
  readonly providerCode?: string
  readonly model?: string
  readonly endpoint: string
  readonly operation?: "chat" | "vision"

  constructor(details: AiErrorDetails) {
    super(details.message)
    this.name = "AiProviderError"
    this.kind = details.kind
    this.httpStatus = details.httpStatus
    this.provider = details.provider
    this.providerType = details.providerType
    this.providerCode = details.providerCode
    this.model = details.model
    this.endpoint = details.endpoint
    this.operation = details.operation
    this.statusCode = mapAiErrorToStatusCode(details.kind)
    logAiError(details)
  }
}

export type AiErrorKind =
  | "not_configured"
  | "invalid_api_key"
  | "insufficient_quota"
  | "rate_limit"
  | "model_error"
  | "invalid_request"
  | "timeout"
  | "provider_error"
  | "empty_response"
  | "validation_error"
  | "unknown"

export interface AiErrorDetails {
  kind: AiErrorKind
  httpStatus?: number
  provider?: AiProviderName
  providerType?: string
  providerCode?: string
  endpoint: string
  model?: string
  message: string
  operation?: "chat" | "vision"
}

export function classifyProviderHttpError(params: {
  httpStatus: number
  providerCode?: string
  providerType?: string
  message: string
}): AiErrorKind {
  const { httpStatus, providerCode, providerType, message } = params
  const lowerMessage = message.toLowerCase()
  const code = (providerCode ?? providerType ?? "").toLowerCase()

  if (httpStatus === 401 || httpStatus === 403) return "invalid_api_key"

  if (httpStatus === 429) {
    if (
      code.includes("quota") ||
      code.includes("resource_exhausted") ||
      lowerMessage.includes("quota") ||
      lowerMessage.includes("exceeded your current quota") ||
      lowerMessage.includes("billing")
    ) {
      return "insufficient_quota"
    }
    return "rate_limit"
  }

  if (httpStatus === 404) return "model_error"

  if (httpStatus === 400) {
    if (
      lowerMessage.includes("model") &&
      (lowerMessage.includes("not found") ||
        lowerMessage.includes("does not exist") ||
        lowerMessage.includes("not available") ||
        lowerMessage.includes("unsupported"))
    ) {
      return "model_error"
    }
    return "invalid_request"
  }

  if (httpStatus >= 500) return "provider_error"

  return "unknown"
}

/** @deprecated Use classifyProviderHttpError */
export function classifyOpenAiError(params: {
  httpStatus: number
  openaiType?: string
  openaiCode?: string
  message: string
}) {
  return classifyProviderHttpError({
    httpStatus: params.httpStatus,
    providerType: params.openaiType,
    providerCode: params.openaiCode,
    message: params.message,
  })
}

export function mapAiErrorToStatusCode(kind: AiErrorKind): number {
  switch (kind) {
    case "not_configured":
      return 503
    case "invalid_api_key":
      return 503
    case "insufficient_quota":
      return 503
    case "rate_limit":
      return 429
    case "model_error":
      return 503
    case "invalid_request":
      return 400
    case "timeout":
      return 504
    case "validation_error":
      return 502
    case "empty_response":
      return 502
    case "provider_error":
      return 502
    default:
      return 502
  }
}

export function logAiError(details: AiErrorDetails) {
  if (process.env.NODE_ENV !== "development") return

  console.error("[AI Provider]", {
    kind: details.kind,
    provider: details.provider ?? "unknown",
    operation: details.operation ?? "unknown",
    endpoint: details.endpoint,
    model: details.model ?? "unknown",
    httpStatus: details.httpStatus ?? "n/a",
    providerType: details.providerType ?? "n/a",
    providerCode: details.providerCode ?? "n/a",
    message: details.message,
  })
}

export function getAiErrorHint(kind: AiErrorKind, provider?: AiProviderName) {
  const label = provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "AI"

  switch (kind) {
    case "not_configured":
      return provider === "gemini"
        ? "Set GEMINI_API_KEY and AI_PROVIDER=gemini in .env.local, then restart."
        : "Set AI_PROVIDER_API_KEY (and AI_PROVIDER=openai) in .env.local, then restart."
    case "invalid_api_key":
      return `${label} rejected the API key. Verify server-only credentials.`
    case "insufficient_quota":
      return `${label} quota/billing exhausted. Check billing or switch AI_PROVIDER.`
    case "rate_limit":
      return `${label} rate limit hit. Retry after a short wait.`
    case "model_error":
      return provider === "gemini"
        ? "Configured Gemini model may be invalid. Check GEMINI_CHAT_MODEL / GEMINI_VISION_MODEL."
        : "Configured OpenAI model may be invalid. Check AI_CHAT_MODEL / AI_VISION_MODEL."
    case "invalid_request":
      return `${label} rejected the request payload. Check model capabilities and request format.`
    case "timeout":
      return `${label} request timed out. Increase AI_REQUEST_TIMEOUT_MS or retry.`
    default:
      return "See server logs for details."
  }
}

interface OpenAiErrorBody {
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

export function parseOpenAiErrorBody(body: string): {
  message: string
  providerType?: string
  providerCode?: string
} {
  try {
    const parsed = JSON.parse(body) as OpenAiErrorBody
    return {
      message: parsed.error?.message ?? body.slice(0, 300),
      providerType: parsed.error?.type,
      providerCode: parsed.error?.code,
    }
  } catch {
    return { message: body.slice(0, 300) }
  }
}

export function parseGeminiError(error: unknown): {
  message: string
  httpStatus?: number
  providerType?: string
  providerCode?: string
} {
  if (!error || typeof error !== "object") {
    return { message: "Gemini request failed" }
  }

  const err = error as Record<string, unknown>
  const message =
    (typeof err.message === "string" && err.message) ||
    (typeof err.statusText === "string" && err.statusText) ||
    "Gemini request failed"

  const httpStatus =
    typeof err.status === "number"
      ? err.status
      : typeof err.code === "number"
        ? err.code
        : undefined

  const providerCode =
    typeof err.code === "string"
      ? err.code
      : typeof (err.error as { code?: string } | undefined)?.code === "string"
        ? (err.error as { code: string }).code
        : undefined

  const providerType =
    typeof err.name === "string"
      ? err.name
      : typeof (err.error as { status?: string } | undefined)?.status === "string"
        ? (err.error as { status: string }).status
        : undefined

  return { message, httpStatus, providerType, providerCode }
}

export function logAiConfigDiagnostic() {
  if (process.env.NODE_ENV !== "development") return

  console.info("[AI Provider config]", {
    primaryProvider: process.env.AI_PROVIDER?.trim() || "openai",
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER?.trim() || "none",
    openaiConfigured: Boolean(process.env.AI_PROVIDER_API_KEY?.trim()),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    openaiChatModel: process.env.AI_CHAT_MODEL?.trim() || "gpt-4o-mini",
    openaiVisionModel: process.env.AI_VISION_MODEL?.trim() || "gpt-4o-mini",
    geminiChatModel: process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.0-flash",
    geminiVisionModel: process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.0-flash",
  })
}

export function createAiProviderError(params: {
  kind?: AiErrorKind
  httpStatus?: number
  provider: AiProviderName
  providerType?: string
  providerCode?: string
  message: string
  model?: string
  endpoint: string
  operation: "chat" | "vision"
}): AiProviderError {
  const kind =
    params.kind ??
    (params.httpStatus
      ? classifyProviderHttpError({
          httpStatus: params.httpStatus,
          providerType: params.providerType,
          providerCode: params.providerCode,
          message: params.message,
        })
      : "unknown")

  return new AiProviderError({
    kind,
    httpStatus: params.httpStatus,
    provider: params.provider,
    providerType: params.providerType,
    providerCode: params.providerCode,
    endpoint: params.endpoint,
    model: params.model,
    message: params.message,
    operation: params.operation,
  })
}
