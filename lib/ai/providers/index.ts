import { getAiRuntimeConfig, isProviderConfigured } from "@/lib/ai/config"
import {
  createAiProviderError,
  AiProviderError,
} from "@/lib/ai/errors"
import { createGeminiProvider } from "@/lib/ai/providers/gemini"
import { createOpenAiProvider } from "@/lib/ai/providers/openai"
import type { AiProviderAdapter, AiProviderName } from "@/lib/ai/types"

export function getAiProvider(name: AiProviderName): AiProviderAdapter {
  const config = getAiRuntimeConfig()
  if (!config) {
    throw createAiProviderError({
      kind: "not_configured",
      provider: name,
      message: "AI service is not configured",
      endpoint: "provider-router",
      operation: "chat",
    })
  }

  if (name === "gemini") {
    if (!config.gemini) {
      throw createAiProviderError({
        kind: "not_configured",
        provider: "gemini",
        message: "Gemini is not configured (missing GEMINI_API_KEY)",
        endpoint: "provider-router",
        operation: "chat",
      })
    }
    return createGeminiProvider(config.gemini, config.timeoutMs, config.visionTimeoutMs)
  }

  if (!config.openai) {
    throw createAiProviderError({
      kind: "not_configured",
      provider: "openai",
      message: "OpenAI is not configured (missing AI_PROVIDER_API_KEY)",
      endpoint: "provider-router",
      operation: "chat",
    })
  }
  return createOpenAiProvider(config.openai, config.timeoutMs, config.visionTimeoutMs)
}

export function getPrimaryAiProvider(): AiProviderAdapter {
  const config = getAiRuntimeConfig()
  if (!config) {
    throw createAiProviderError({
      kind: "not_configured",
      provider: "openai",
      message: "AI service is not configured",
      endpoint: "provider-router",
      operation: "chat",
    })
  }
  return getAiProvider(config.primaryProvider)
}

export async function executeWithOptionalFallback<T>(
  operation: "chat" | "vision",
  run: (provider: AiProviderAdapter) => Promise<T>,
): Promise<T> {
  const config = getAiRuntimeConfig()
  if (!config) {
    throw createAiProviderError({
      kind: "not_configured",
      provider: "openai",
      message: "AI service is not configured",
      endpoint: "provider-router",
      operation,
    })
  }

  const primary = getAiProvider(config.primaryProvider)

  try {
    return await run(primary)
  } catch (error) {
    const fallback = config.fallbackProvider
    if (
      !fallback ||
      fallback === config.primaryProvider ||
      !isProviderConfigured(config, fallback)
    ) {
      throw error
    }

    if (process.env.NODE_ENV === "development" && error instanceof AiProviderError) {
      console.warn(
        `[AI Provider] Primary ${config.primaryProvider} failed (${error.kind}). Trying fallback ${fallback}.`,
      )
    }

    const fallbackProvider = getAiProvider(fallback)
    return run(fallbackProvider)
  }
}
