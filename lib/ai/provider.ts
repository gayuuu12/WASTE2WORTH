import "server-only"

import { executeWithOptionalFallback } from "@/lib/ai/providers/index"

export { AiProviderError } from "@/lib/ai/errors"

export async function callVisionJsonCompletion(params: {
  systemPrompt: string
  userPrompt: string
  imageBase64: string
  mimeType: string
}) {
  return executeWithOptionalFallback("vision", (provider) =>
    provider.analyzeWasteVision(params),
  )
}

export async function callTextCompletion(params: {
  systemPrompt: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
}) {
  return executeWithOptionalFallback("chat", (provider) => provider.chat(params))
}
