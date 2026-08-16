import Link from "next/link"
import type { Conversation } from "@/lib/types"
import { formatDate, relativeTime } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ConversationCard({
  conversation,
  counterpartyName,
  latestMessageBody,
}: {
  conversation: Conversation
  counterpartyName: string
  latestMessageBody: string | null
}) {
  const listingLabel =
    conversation.listing?.title ??
    conversation.listing?.material_name ??
    "Listing"

  return (
    <Link href={`/dashboard/messages/${conversation.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-lg">{counterpartyName}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {relativeTime(conversation.last_message_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{listingLabel}</p>
        </CardHeader>
        <CardContent>
          {latestMessageBody ? (
            <p className="line-clamp-2 text-sm">{latestMessageBody}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No messages yet</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Started {formatDate(conversation.created_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
