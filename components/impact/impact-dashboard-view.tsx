import Link from "next/link"
import type { ImpactDashboardData } from "@/lib/impact/metrics"
import type { ImpactPeriod } from "@/lib/impact/constants"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { ImpactKpiGrid } from "@/components/impact/impact-kpi-grid"
import { MaterialJourneySection } from "@/components/impact/material-journey-section"
import {
  CircularMaterialTrendChart,
  EconomicValueTrendChart,
  MaterialsCirculatedChart,
  OutcomeBreakdownChart,
} from "@/components/impact/impact-charts"
import { ImpactRecordsTable } from "@/components/impact/impact-records-table"
import { ImpactMethodologyPanel } from "@/components/impact/impact-methodology"
import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

export function ImpactDashboardView({
  data,
  period,
  primaryCurrency,
}: {
  data: ImpactDashboardData
  period: ImpactPeriod
  primaryCurrency: string
}) {
  const { kpis } = data
  const hasTransactions = kpis.completedTransactions > 0
  const hasOutcomes = kpis.outcomeCoverage.reported > 0

  if (!hasTransactions) {
    return (
      <EmptyState
        title="Your circular impact will appear here"
        description="Complete your first Waste2Worth transaction to start building your impact history."
        icon={<Leaf className="size-5" aria-hidden />}
      >
        <Link href="/dashboard/transactions" className={cn(buttonVariants())}>
          View transactions
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-muted/20 p-6">
        <h2 className="font-display text-xl font-semibold">Your Circular Economy Impact</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{data.narrative}</p>
      </section>

      <ImpactKpiGrid kpis={kpis} role={data.role} />

      {!hasOutcomes ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          You have completed material exchanges, but no recovery outcomes have been reported yet.
          {data.role === "buyer" || data.role === "both" ? (
            <>
              {" "}
              <Link href="/dashboard/transactions" className="font-medium text-primary hover:underline">
                Record an outcome
              </Link>{" "}
              on a completed transaction.
            </>
          ) : (
            " Waiting for buyers to report downstream outcomes."
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Outcomes reported for {kpis.outcomeCoverage.reported} of {kpis.outcomeCoverage.eligible}{" "}
          completed transactions
        </p>
      )}

      <MaterialJourneySection journeys={data.journeys} />

      <div className="grid gap-6 xl:grid-cols-2">
        <CircularMaterialTrendChart data={data.trend} />
        <EconomicValueTrendChart data={data.trend} currency={primaryCurrency} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MaterialsCirculatedChart data={data.categoryBreakdown} />
        <OutcomeBreakdownChart data={data.outcomeBreakdown} />
      </div>

      <ImpactRecordsTable records={data.records} />

      <ImpactMethodologyPanel />
    </div>
  )
}
