import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireCompleteProfile } from "@/lib/auth"
import { getUnreadNotificationCount } from "@/lib/notifications/queries"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const unreadNotificationCount = await getUnreadNotificationCount(
    supabase,
    ctx.user.id,
  )

  return (
    <DashboardShell
      company={ctx.company}
      unreadNotificationCount={unreadNotificationCount}
      userId={ctx.user.id}
    >
      {children}
    </DashboardShell>
  )
}
