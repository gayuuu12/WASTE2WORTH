import type { AiProviderName, AiRuntimeConfig } from "@/lib/ai/types"
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_CHAT_MODEL,
  DEFAULT_OPENAI_VISION_MODEL,
} from "@/lib/ai/types"

function normalizeEnvValue(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parseProvider(value: string | undefined): AiProviderName {
  const normalized = normalizeEnvValue(value)?.toLowerCase()
  if (normalized === "gemini") return "gemini"
  return "openai"
}

export function getAiRuntimeConfig(): AiRuntimeConfig | null {
  const primaryProvider = parseProvider(process.env.AI_PROVIDER)
  const fallbackRaw = normalizeEnvValue(process.env.AI_FALLBACK_PROVIDER)?.toLowerCase()
  const fallbackProvider =
    fallbackRaw === "openai" || fallbackRaw === "gemini"
      ? (fallbackRaw as AiProviderName)
      : undefined

  const openaiKey = normalizeEnvValue(process.env.AI_PROVIDER_API_KEY)
  const geminiKey = normalizeEnvValue(process.env.GEMINI_API_KEY)

  const openai =
    openaiKey
      ? {
          apiKey: openaiKey,
          chatModel:
            normalizeEnvValue(process.env.AI_CHAT_MODEL) || DEFAULT_OPENAI_CHAT_MODEL,
          visionModel:
            normalizeEnvValue(process.env.AI_VISION_MODEL) || DEFAULT_OPENAI_VISION_MODEL,
        }
      : undefined

  const gemini =
    geminiKey
      ? {
          apiKey: geminiKey,
          chatModel:
            normalizeEnvValue(process.env.GEMINI_CHAT_MODEL) || DEFAULT_GEMINI_MODEL,
          visionModel:
            normalizeEnvValue(process.env.GEMINI_VISION_MODEL) || DEFAULT_GEMINI_MODEL,
        }
      : undefined

  const primaryReady =
    primaryProvider === "gemini" ? Boolean(gemini) : Boolean(openai)

  if (!primaryReady) {
    return null
  }

  return {
    primaryProvider,
    fallbackProvider:
      fallbackProvider && fallbackProvider !== primaryProvider
        ? fallbackProvider
        : undefined,
    timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 45000),
    visionTimeoutMs: Number(process.env.AI_VISION_TIMEOUT_MS ?? 60000),
    openai,
    gemini,
  }
}

export function isAiConfigured() {
  return getAiRuntimeConfig() !== null
}

export function isProviderConfigured(
  config: AiRuntimeConfig,
  provider: AiProviderName,
) {
  return provider === "gemini" ? Boolean(config.gemini) : Boolean(config.openai)
}

/** @deprecated Use getAiRuntimeConfig — kept for any legacy imports */
export function getAiProviderConfig() {
  const config = getAiRuntimeConfig()
  if (!config) return null
  const settings =
    config.primaryProvider === "gemini" ? config.gemini : config.openai
  if (!settings) return null
  return {
    provider: config.primaryProvider,
    apiKey: settings.apiKey,
    chatModel: settings.chatModel,
    visionModel: settings.visionModel,
    timeoutMs: config.timeoutMs,
  }
}
