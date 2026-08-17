import { AiProviderError } from "@/lib/ai/errors"
import { isRetryableVisionError } from "@/lib/ai/analysis-timings"
import { callVisionJsonCompletion } from "@/lib/ai/provider"

const RETRY_DELAY_MS = 1500

/** Vision-only: retry once on Gemini 503/UNAVAILABLE — never after client timeout. */
export async function callVisionJsonCompletionWithRetry(params: {
  systemPrompt: string
  userPrompt: string
  imageBase64: string
  mimeType: string
}) {
  try {
    return await callVisionJsonCompletion(params)
  } catch (error) {
    if (!(error instanceof AiProviderError) || !isRetryableVisionError(error)) {
      throw error
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[AI vision] capacity failure, retrying once", {
        kind: error.kind,
        httpStatus: error.httpStatus ?? null,
        providerType: error.providerType ?? null,
      })
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return callVisionJsonCompletion(params)
  }
}
