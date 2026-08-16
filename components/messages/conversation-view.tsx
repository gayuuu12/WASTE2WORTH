import Link from "next/link"
import type { Conversation, Message } from "@/lib/types"
import { RealtimeMessageThread } from "@/components/messages/realtime-message-thread"
import { MessageComposer } from "@/components/messages/message-composer"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-6">
      <Link
        href="/dashboard/messages"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to messages
      </Link>

      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {counterpartyName}
        </h1>
        {listingLabel ? (
          <p className="text-muted-foreground">
            Re: {listingLabel}
            {conversation.listing?.material_name &&
            conversation.listing.material_name !== listingLabel
              ? ` · ${conversation.listing.material_name}`
              : null}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RealtimeMessageThread
            conversationId={conversation.id}
            initialMessages={messages}
            ownCompanyId={ownCompanyId}
            ownCompanyName={ownCompanyName}
            counterpartyName={counterpartyName}
          />
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border p-4">
        <MessageComposer conversationId={conversation.id} />
      </div>
    </div>
  )
}
