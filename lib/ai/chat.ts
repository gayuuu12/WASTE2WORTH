import "server-only"

import { callTextCompletion } from "@/lib/ai/provider"
import {
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantContext,
} from "@/lib/ai/prompts"
import type { ChatMessage } from "@/lib/validations/ai"

export async function generateAssistantReply(params: {
  messages: ChatMessage[]
  role?: string | null
  companyName?: string | null
  pageContext?: string
}) {
  const contextBlock = buildAssistantContext({
    role: params.role,
    companyName: params.companyName,
    pageContext: params.pageContext,
  })

  const systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}\n\n${contextBlock}`

  return callTextCompletion({
    systemPrompt,
    messages: params.messages,
  })
}
