"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { ASSISTANT_QUICK_PROMPTS } from "@/lib/ai/chat-prompts"
import type { ChatMessage } from "@/lib/validations/ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const SESSION_KEY = "waste2worth-assistant-messages"

function loadSessionMessages(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed.slice(-20) : []
  } catch {
    return []
  }
}

function saveSessionMessages(messages: ChatMessage[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-20)))
}

function renderMessageContent(content: string) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (match) {
      const [, label, href] = match
      if (href.startsWith("/dashboard") || href.startsWith("/marketplace")) {
        return (
          <Link key={`${href}-${index}`} href={href} className="text-primary underline">
            {label}
          </Link>
        )
      }
      return <span key={index}>{label}</span>
    }
    return <span key={index}>{part}</span>
  })
}

export function AssistantChat({
  role,
  pageContext,
  compact = false,
}: {
  role?: "supplier" | "buyer" | "both" | null
  pageContext?: string
  compact?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(loadSessionMessages())
  }, [])

  useEffect(() => {
    saveSessionMessages(messages)
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const quickPrompts =
    role === "buyer"
      ? ASSISTANT_QUICK_PROMPTS.buyer
      : role === "supplier"
        ? ASSISTANT_QUICK_PROMPTS.seller
        : ASSISTANT_QUICK_PROMPTS.general

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          pageContext,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Assistant unavailable")
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI Assistant is temporarily unavailable. You can continue using Waste2Worth normally.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn("shadow-sm", compact && "border-0 shadow-none")}>
      {!compact ? (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Waste2Worth AI Assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask about selling, buying, materials, listings, offers, or marketplace use.
          </p>
        </CardHeader>
      ) : null}
      <CardContent className={cn("space-y-4", compact && "p-0")}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a prompt to get started, or type your own question below.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-[min(420px,60vh)] space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/20 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-card border border-border",
                )}
              >
                {renderMessageContent(message.content)}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Thinking…
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void sendMessage(input)
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Waste2Worth AI…"
            disabled={loading}
            maxLength={4000}
            className="min-h-11"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-11 shrink-0"
          >
            <Send className="size-4" aria-hidden />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function AssistantFloatingButton({
  role,
}: {
  role?: "supplier" | "buyer" | "both" | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed bottom-6 right-6 z-40 shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <MessageCircle />}
        {open ? "Close" : "Ask Waste2Worth AI"}
      </Button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 w-[min(100vw-2rem,420px)] rounded-xl border bg-background p-4 shadow-xl">
          <AssistantChat role={role} pageContext="dashboard floating panel" compact />
        </div>
      ) : null}
    </>
  )
}
