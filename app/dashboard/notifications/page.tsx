import { NotificationList } from "@/components/notifications/notification-list"
import { requireCompleteProfile } from "@/lib/auth"
import { getNotificationsForUser } from "@/lib/notifications/queries"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const notifications = await getNotificationsForUser(supabase, ctx.user.id)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Updates on offers, transactions, and messages from your marketplace activity.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  )
}
