import { NotificationList } from "@/components/notifications/notification-list"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"
import { getNotificationsForUser } from "@/lib/notifications/queries"
import { createClient } from "@/lib/supabase/server"
import { Bell } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const notifications = await getNotificationsForUser(supabase, ctx.user.id)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Updates on offers, transactions, and messages from your marketplace activity."
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="New notifications about offers, transactions, and messages will appear here."
          icon={<Bell className="size-5" aria-hidden />}
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  )
}
