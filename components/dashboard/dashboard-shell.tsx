import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { canCreateListings } from "@/lib/listings/auth"
import { canViewOffers } from "@/lib/offers/auth"
import { canManageRequirements } from "@/lib/requirements/auth"
import type { Company } from "@/lib/types"

export function DashboardShell({
  children,
  company,
  unreadNotificationCount,
  userId,
}: {
  children: React.ReactNode
  company: Company
  unreadNotificationCount: number
  userId: string
}) {
  const canList = canCreateListings(company)
  const canRequire = canManageRequirements(company)
  const showOffers = canViewOffers(company)

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        company={company}
        canList={canList}
        canRequire={canRequire}
        showOffers={showOffers}
        unreadNotificationCount={unreadNotificationCount}
        userId={userId}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
