"use client"

import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftRight,
  Bell,
  Handshake,
  MessageSquare,
} from "lucide-react"
import type { Notification } from "@/lib/types"
import { formatDate, relativeTime } from "@/lib/format"
import { markNotificationReadFormAction } from "@/lib/actions/notifications"
import { isSafeNotificationLink } from "@/lib/notifications/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function getNotificationIcon(type: string): LucideIcon {
  if (type.includes("offer")) return Handshake
  if (type.includes("message")) return MessageSquare
  if (type.includes("transaction")) return ArrowLeftRight
  return Bell
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()
  const isUnread = notification.read_at === null
  const hasLink = isSafeNotificationLink(notification.link)
  const Icon = getNotificationIcon(notification.type ?? "")

  async function handleOpen() {
    if (isUnread) {
      const formData = new FormData()
      formData.set("notificationId", notification.id)
      await markNotificationReadFormAction(formData)
    }
    if (hasLink) {
      router.push(notification.link!)
    } else {
      router.refresh()
    }
  }

  async function handleMarkRead() {
    const formData = new FormData()
    formData.set("notificationId", notification.id)
    await markNotificationReadFormAction(formData)
    router.refresh()
  }

  const content = (
    <div className="flex gap-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className={cn("font-medium", !isUnread && "text-muted-foreground")}>
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {relativeTime(notification.created_at)}
          </span>
        </div>
        {notification.body ? (
          <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(notification.created_at)}
          {isUnread ? (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Unread
            </span>
          ) : null}
        </p>
      </div>
    </div>
  )

  if (hasLink) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isUnread ? "border-primary/30 bg-primary/5" : "border-border bg-card",
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isUnread ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">{content}</div>
        {isUnread ? (
          <Button type="button" variant="outline" size="sm" onClick={handleMarkRead}>
            Mark read
          </Button>
        ) : null}
      </div>
    </div>
  )
}
