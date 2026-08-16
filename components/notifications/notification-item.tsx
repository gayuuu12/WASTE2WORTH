"use client"

import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/types"
import { formatDate, relativeTime } from "@/lib/format"
import { markNotificationReadFormAction } from "@/lib/actions/notifications"
import { isSafeNotificationLink } from "@/lib/notifications/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()
  const isUnread = notification.read_at === null
  const hasLink = isSafeNotificationLink(notification.link)

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
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={cn("font-medium", isUnread && "text-foreground")}>
          {notification.title}
        </p>
        <span className="text-xs text-muted-foreground">
          {relativeTime(notification.created_at)}
        </span>
      </div>
      {notification.body ? (
        <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {formatDate(notification.created_at)}
        {isUnread ? " · Unread" : " · Read"}
      </p>
    </>
  )

  if (hasLink) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40",
          isUnread ? "border-primary/30 bg-primary/5" : "border-border",
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
        isUnread ? "border-primary/30 bg-primary/5" : "border-border",
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
