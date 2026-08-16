import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireCompleteProfile } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireCompleteProfile()

  return <DashboardShell company={ctx.company}>{children}</DashboardShell>
}
