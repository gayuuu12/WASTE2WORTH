import {
  createAiProviderError,
  AiProviderError,
  classifyProviderHttpError,
} from "@/lib/ai/errors"
import { GEMINI_WASTE_ANALYSIS_RESPONSE_SCHEMA } from "@/lib/ai/waste-analysis-enums"
import type {
  AiProviderAdapter,
  GeminiProviderSettings,
  TextChatRequest,
  VisionAnalysisRequest,
} from "@/lib/ai/types"

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: {
    message?: string
    status?: string
    code?: number
  }
}

export function createGeminiProvider(
  settings: GeminiProviderSettings,
  chatTimeoutMs: number,
  visionTimeoutMs: number,
): AiProviderAdapter {
  return {
    name: "gemini",
    analyzeWasteVision: (request) =>
      callGeminiGenerate(settings, visionTimeoutMs, {
        model: settings.visionModel,
        operation: "vision",
        systemPrompt: request.systemPrompt,
        jsonMode: true,
        maxOutputTokens: 2500,
        userParts: [
          { text: request.userPrompt },
          {
            inlineData: {
              mimeType: request.mimeType,
              data: request.imageBase64,
            },
          },
        ],
      }),
    chat: (request) =>
      callGeminiGenerate(settings, chatTimeoutMs, {
        model: settings.chatModel,
        operation: "chat",
        systemPrompt: request.systemPrompt,
        maxOutputTokens: 2000,
        contents: request.messages.map((message) => ({
          role: message.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: message.content }],
        })),
      }),
  }
}

async function callGeminiGenerate(
  settings: GeminiProviderSettings,
  timeoutMs: number,
  params: {
    model: string
    operation: "chat" | "vision"
    systemPrompt: string
    jsonMode?: boolean
    responseSchema?: Record<string, unknown>
    maxOutputTokens?: number
    userParts?: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    >
    contents?: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>
  },
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const endpoint = `${GEMINI_API_BASE}/models/${params.model}:generateContent`

  try {
    const url = `${endpoint}?key=${encodeURIComponent(settings.apiKey)}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemPrompt }],
        },
        contents: params.contents ?? [
          {
            role: "user",
            parts: params.userParts ?? [{ text: "Analyze this waste image." }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: params.maxOutputTokens ?? 2000,
          ...(params.jsonMode
            ? {
                responseMimeType: "application/json",
                responseSchema: params.responseSchema ?? GEMINI_WASTE_ANALYSIS_RESPONSE_SCHEMA,
              }
            : {}),
        },
      }),
    })

    const bodyText = await response.text()
    let data: GeminiGenerateResponse
    try {
      data = JSON.parse(bodyText) as GeminiGenerateResponse
    } catch {
      throw createAiProviderError({
        httpStatus: response.status,
        provider: "gemini",
        message: bodyText.slice(0, 300) || "Gemini returned a non-JSON response",
        model: params.model,
        endpoint,
        operation: params.operation,
      })
    }

    if (!response.ok || data.error) {
      const message = data.error?.message ?? bodyText.slice(0, 300)
      throw createAiProviderError({
        httpStatus: response.status,
        provider: "gemini",
        providerType: data.error?.status,
        providerCode:
          typeof data.error?.code === "number" ? String(data.error.code) : undefined,
        message,
        model: params.model,
        endpoint,
        operation: params.operation,
      })
    }

    const content = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim()

    if (!content) {
      throw createAiProviderError({
        kind: "empty_response",
        provider: "gemini",
        message: "Gemini returned an empty response",
        model: params.model,
        endpoint,
        operation: params.operation,
      })
    }

    return content
  } catch (error) {
    if (error instanceof AiProviderError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw createAiProviderError({
        kind: "timeout",
        provider: "gemini",
        message: "Gemini request timed out",
        model: params.model,
        endpoint,
        operation: params.operation,
      })
    }

    const message = error instanceof Error ? error.message : "Gemini request failed"
    throw createAiProviderError({
      kind: classifyProviderHttpError({
        httpStatus: 0,
        message,
      }),
      provider: "gemini",
      message,
      model: params.model,
      endpoint,
      operation: params.operation,
    })
  } finally {
    clearTimeout(timeout)
  }
}
