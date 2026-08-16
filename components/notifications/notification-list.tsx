import { NotificationItem } from "@/components/notifications/notification-item"
import { markAllNotificationsReadFormAction } from "@/lib/actions/notifications"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/types"

export function NotificationList({
  notifications,
}: {
  notifications: Notification[]
}) {
  const hasUnread = notifications.some((n) => n.read_at === null)

  return (
    <div className="space-y-4">
      {hasUnread ? (
        <form action={markAllNotificationsReadFormAction}>
          <Button type="submit" variant="outline" size="sm">
            Mark all as read
          </Button>
        </form>
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  )
}
