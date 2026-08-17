export type AiProviderName = "openai" | "gemini"

export interface OpenAiProviderSettings {
  apiKey: string
  chatModel: string
  visionModel: string
}

export interface GeminiProviderSettings {
  apiKey: string
  chatModel: string
  visionModel: string
}

export interface AiRuntimeConfig {
  primaryProvider: AiProviderName
  fallbackProvider?: AiProviderName
  timeoutMs: number
  visionTimeoutMs: number
  openai?: OpenAiProviderSettings
  gemini?: GeminiProviderSettings
}

export interface VisionAnalysisRequest {
  systemPrompt: string
  userPrompt: string
  imageBase64: string
  mimeType: string
}

export interface TextChatRequest {
  systemPrompt: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
}

export interface AiProviderAdapter {
  name: AiProviderName
  analyzeWasteVision(request: VisionAnalysisRequest): Promise<string>
  chat(request: TextChatRequest): Promise<string>
}

/** Default Gemini model — multimodal + JSON output; override via GEMINI_*_MODEL env vars. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"

/** Default OpenAI models; override via AI_*_MODEL env vars. */
export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4o-mini"
export const DEFAULT_OPENAI_VISION_MODEL = "gpt-4o-mini"
