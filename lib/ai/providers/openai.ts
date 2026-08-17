import { getAiRuntimeConfig } from "@/lib/ai/config"
import {
  createAiProviderError,
  AiProviderError,
  parseOpenAiErrorBody,
} from "@/lib/ai/errors"
import type {
  AiProviderAdapter,
  OpenAiProviderSettings,
  TextChatRequest,
  VisionAnalysisRequest,
} from "@/lib/ai/types"

const OPENAI_CHAT_COMPLETIONS_ENDPOINT = "https://api.openai.com/v1/chat/completions"

export function createOpenAiProvider(
  settings: OpenAiProviderSettings,
  chatTimeoutMs: number,
  visionTimeoutMs: number,
): AiProviderAdapter {
  return {
    name: "openai",
    analyzeWasteVision: (request) =>
      callOpenAiVisionJson(settings, visionTimeoutMs, request),
    chat: (request) => callOpenAiText(settings, chatTimeoutMs, request),
  }
}

async function callOpenAiVisionJson(
  settings: OpenAiProviderSettings,
  timeoutMs: number,
  request: VisionAnalysisRequest,
) {
  return callOpenAiCompletion(settings, timeoutMs, {
    model: settings.visionModel,
    operation: "vision",
    jsonMode: true,
    maxTokens: 2500,
    messages: [
      { role: "system", content: request.systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: request.userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${request.mimeType};base64,${request.imageBase64}`,
            },
          },
        ],
      },
    ],
  })
}

async function callOpenAiText(
  settings: OpenAiProviderSettings,
  timeoutMs: number,
  request: TextChatRequest,
) {
  return callOpenAiCompletion(settings, timeoutMs, {
    model: settings.chatModel,
    operation: "chat",
    messages: [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  })
}

async function callOpenAiCompletion(
  settings: OpenAiProviderSettings,
  timeoutMs: number,
  params: {
    model: string
    operation: "chat" | "vision"
    messages: Array<{
      role: "system" | "user" | "assistant"
      content:
        | string
        | Array<
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
          >
    }>
    jsonMode?: boolean
    maxTokens?: number
  },
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        max_tokens: params.maxTokens ?? 2000,
        temperature: 0.2,
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      const parsed = parseOpenAiErrorBody(body)
      throw createAiProviderError({
        httpStatus: response.status,
        provider: "openai",
        providerType: parsed.providerType,
        providerCode: parsed.providerCode,
        message: parsed.message,
        model: params.model,
        endpoint: OPENAI_CHAT_COMPLETIONS_ENDPOINT,
        operation: params.operation,
      })
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw createAiProviderError({
        kind: "empty_response",
        provider: "openai",
        message: "AI returned an empty response",
        model: params.model,
        endpoint: OPENAI_CHAT_COMPLETIONS_ENDPOINT,
        operation: params.operation,
      })
    }

    return content
  } catch (error) {
    if (error instanceof AiProviderError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw createAiProviderError({
        kind: "timeout",
        provider: "openai",
        message: "AI request timed out",
        model: params.model,
        endpoint: OPENAI_CHAT_COMPLETIONS_ENDPOINT,
        operation: params.operation,
      })
    }
    throw createAiProviderError({
      kind: "unknown",
      provider: "openai",
      message: error instanceof Error ? error.message : "AI request failed",
      model: params.model,
      endpoint: OPENAI_CHAT_COMPLETIONS_ENDPOINT,
      operation: params.operation,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export function assertOpenAiConfigured() {
  const config = getAiRuntimeConfig()
  if (!config?.openai) {
    throw createAiProviderError({
      kind: "not_configured",
      provider: "openai",
      message: "OpenAI is not configured",
      endpoint: OPENAI_CHAT_COMPLETIONS_ENDPOINT,
      operation: "chat",
    })
  }
  return config
}
