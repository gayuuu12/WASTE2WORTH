import type { Message } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export function MessageBubble({
  message,
  isOwn,
  senderLabel,
}: {
  message: Message
  isOwn: boolean
  senderLabel: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[85%]",
        isOwn ? "ml-auto items-end" : "mr-auto items-start",
      )}
    >
      <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{senderLabel}</span>
        <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.body}
      </div>
    </div>
  )
}
