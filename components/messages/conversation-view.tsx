import Link from "next/link"
import type { Conversation, Message } from "@/lib/types"
import { RealtimeMessageThread } from "@/components/messages/realtime-message-thread"
import { MessageComposer } from "@/components/messages/message-composer"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ConversationView({
  conversation,
  messages,
  counterpartyName,
  ownCompanyName,
  ownCompanyId,
}: {
  conversation: Conversation
  messages: Message[]
  counterpartyName: string
  ownCompanyName: string
  ownCompanyId: string
}) {
  const listingLabel =
    conversation.listing?.title ??
    conversation.listing?.material_name ??
    null

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 lg:min-h-[calc(100dvh-4rem)]">
      <div className="shrink-0 space-y-3">
        <Link
          href="/dashboard/messages"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Back to messages
        </Link>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">{counterpartyName}</h1>
          {listingLabel ? (
            <p className="text-sm text-muted-foreground">
              Re: {listingLabel}
              {conversation.listing?.material_name &&
              conversation.listing.material_name !== listingLabel
                ? ` · ${conversation.listing.material_name}`
                : null}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <RealtimeMessageThread
            conversationId={conversation.id}
            initialMessages={messages}
            ownCompanyId={ownCompanyId}
            ownCompanyName={ownCompanyName}
            counterpartyName={counterpartyName}
          />
        </div>
        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          <MessageComposer conversationId={conversation.id} />
        </div>
      </div>
    </div>
  )
}
