import { NextResponse } from "next/server"
import { generateAssistantReply } from "@/lib/ai/chat"
import { logAiRouteDev } from "@/lib/ai/dev-route-log"
import { checkRateLimit } from "@/lib/ai/rate-limit"
import { isAiConfigured } from "@/lib/ai/config"
import { getAiErrorHint } from "@/lib/ai/errors"
import { AiProviderError } from "@/lib/ai/provider"
import { chatRequestSchema } from "@/lib/validations/ai"
import { getSessionContext } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let authenticated = false
  let providerCalled = false
  let errorKind: string | undefined

  try {
    if (!isAiConfigured()) {
      errorKind = "not_configured"
      const response = NextResponse.json(
        {
          error:
            "AI Assistant is temporarily unavailable. You can continue using Waste2Worth normally.",
        },
        { status: 503 },
      )
      logAiRouteDev("chat", request, {
        authenticated,
        responseStatus: 503,
        providerCalled,
        errorKind,
      })
      return response
    }

    const ctx = await getSessionContext()
    authenticated = Boolean(ctx?.user)

    if (!ctx?.user) {
      errorKind = "unauthenticated"
      const response = NextResponse.json(
        { error: "Please sign in to use the assistant." },
        { status: 401 },
      )
      logAiRouteDev("chat", request, {
        authenticated,
        responseStatus: 401,
        providerCalled,
        errorKind,
      })
      return response
    }

    if (!checkRateLimit(`assistant:${ctx.user.id}`, 20, 60_000)) {
      errorKind = "rate_limit"
      const response = NextResponse.json(
        { error: "Too many messages. Please wait a moment and try again." },
        { status: 429 },
      )
      logAiRouteDev("chat", request, {
        authenticated,
        responseStatus: 429,
        providerCalled,
        errorKind,
      })
      return response
    }

    const body = await request.json()
    const parsed = chatRequestSchema.safeParse(body)

    if (!parsed.success) {
      errorKind = "validation_error"
      const response = NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message" },
        { status: 400 },
      )
      logAiRouteDev("chat", request, {
        authenticated,
        responseStatus: 400,
        providerCalled,
        errorKind,
      })
      return response
    }

    providerCalled = true
    const reply = await generateAssistantReply({
      messages: parsed.data.messages,
      role: ctx.company?.role ?? null,
      companyName: ctx.company?.name ?? null,
      pageContext: parsed.data.pageContext,
    })

    const response = NextResponse.json({ reply })
    logAiRouteDev("chat", request, {
      authenticated,
      responseStatus: 200,
      providerCalled,
    })
    return response
  } catch (error) {
    if (error instanceof AiProviderError) {
      errorKind = error.kind
      if (process.env.NODE_ENV === "development") {
        console.error("[AI chat] request failed:", {
          provider: error.provider,
          kind: error.kind,
          httpStatus: error.httpStatus,
          providerType: error.providerType,
          providerCode: error.providerCode,
          model: error.model,
          endpoint: error.endpoint,
          hint: getAiErrorHint(error.kind, error.provider),
        })
      }
      const response = NextResponse.json(
        {
          error:
            "AI Assistant is temporarily unavailable. You can continue using Waste2Worth normally.",
        },
        { status: error.statusCode },
      )
      logAiRouteDev("chat", request, {
        authenticated,
        responseStatus: error.statusCode,
        providerCalled,
        errorKind,
      })
      return response
    }

    errorKind = "unknown"
    const response = NextResponse.json(
      { error: "Could not get a response from the assistant." },
      { status: 500 },
    )
    logAiRouteDev("chat", request, {
      authenticated,
      responseStatus: 500,
      providerCalled,
      errorKind,
    })
    return response
  }
}
