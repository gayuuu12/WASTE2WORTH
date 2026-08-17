import { Suspense } from "react"
import { requireCompleteProfile } from "@/lib/auth"
import type { ImpactPeriod } from "@/lib/impact/constants"
import { buildImpactDashboardData } from "@/lib/impact/metrics"
import { getImpactTransactionsForCompany } from "@/lib/impact/queries"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { ImpactDashboardView } from "@/components/impact/impact-dashboard-view"
import { ImpactPeriodFilter, ImpactReportLink } from "@/components/impact/impact-period-filter"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

function parsePeriod(value: string | undefined): ImpactPeriod {
  if (
    value === "this_month" ||
    value === "last_3_months" ||
    value === "last_6_months" ||
    value === "this_year" ||
    value === "all_time"
  ) {
    return value
  }
  return "last_6_months"
}

function primaryCurrency(totals: Record<string, number>) {
  const entries = Object.entries(totals)
  if (entries.length === 0) return "INR"
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "INR"
}

async function ImpactContent({ period }: { period: ImpactPeriod }) {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const transactions = await getImpactTransactionsForCompany(supabase, ctx.company.id, period)
  const data = buildImpactDashboardData(transactions, ctx.company.role, period)

  return (
    <ImpactDashboardView
      data={data}
      period={period}
      primaryCurrency={primaryCurrency(data.kpis.economicValueByCurrency)}
    />
  )
}

export default async function ImpactDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const period = parsePeriod(
    typeof rawParams.period === "string" ? rawParams.period : undefined,
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Circular Impact"
        description="Sustainability and economic intelligence from your completed Waste2Worth material exchanges."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Suspense fallback={<Skeleton className="h-16 w-48" />}>
            <ImpactPeriodFilter current={period} />
          </Suspense>
          <ImpactReportLink period={period} />
        </div>
      </PageHeader>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
          </div>
        }
      >
        <ImpactContent period={period} />
      </Suspense>
    </div>
  )
}
