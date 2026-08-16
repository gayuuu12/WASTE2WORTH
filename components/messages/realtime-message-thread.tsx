"use client"

import { useEffect, useRef, useState } from "react"
import type { Message } from "@/lib/types"
import { MessageBubble } from "@/components/messages/message-bubble"
import { createClient } from "@/lib/supabase/client"

export function RealtimeMessageThread({
  conversationId,
  initialMessages,
  ownCompanyId,
  ownCompanyName,
  counterpartyName,
}: {
  conversationId: string
  initialMessages: Message[]
  ownCompanyId: string
  ownCompanyName: string
  counterpartyName: string
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((current) => {
            if (current.some((m) => m.id === incoming.id)) {
              return current
            }
            return [...current, incoming]
          })
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setConnectionError("Live updates unavailable. Refresh to see new messages.")
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No messages yet. Send the first message below.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {connectionError ? (
        <p className="text-xs text-muted-foreground" role="status">
          {connectionError}
        </p>
      ) : null}
      {messages.map((message) => {
        const isOwn = message.sender_company_id === ownCompanyId
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            senderLabel={isOwn ? ownCompanyName : counterpartyName}
          />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
