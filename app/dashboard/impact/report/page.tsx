import { requireCompleteProfile } from "@/lib/auth"
import type { ImpactPeriod } from "@/lib/impact/constants"
import { IMPACT_PERIOD_LABELS } from "@/lib/impact/constants"
import { buildImpactDashboardData, formatEconomicTotals } from "@/lib/impact/metrics"
import { getImpactTransactionsForCompany } from "@/lib/impact/queries"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/format"

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

export default async function ImpactReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const period = parsePeriod(
    typeof rawParams.period === "string" ? rawParams.period : undefined,
  )
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const transactions = await getImpactTransactionsForCompany(supabase, ctx.company.id, period)
  const data = buildImpactDashboardData(transactions, ctx.company.role, period)

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-background p-8 print:p-0">
      <header className="border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">Waste2Worth</p>
        <h1 className="font-display text-3xl font-bold">Circular Impact Report</h1>
        <p className="mt-2 text-muted-foreground">{ctx.company.name}</p>
        <p className="text-sm text-muted-foreground">
          Reporting period: {IMPACT_PERIOD_LABELS[period]} · Generated {formatDate(new Date().toISOString())}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Material circulated</p>
          <p className="text-2xl font-semibold">{data.kpis.materialCirculatedSummary}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Transaction value</p>
          <p className="text-2xl font-semibold">
            {formatEconomicTotals(data.kpis.economicValueByCurrency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Completed transactions</p>
          <p className="text-2xl font-semibold">{data.kpis.completedTransactions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reported recovery rate</p>
          <p className="text-2xl font-semibold">
            {data.kpis.reportedRecoveryRate != null ? `${data.kpis.reportedRecoveryRate}%` : "—"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Summary narrative</h2>
        <p className="mt-2 text-muted-foreground">{data.narrative}</p>
      </section>

      {data.categoryBreakdown.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Materials circulated</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {data.categoryBreakdown.map((item) => (
              <li key={item.category}>
                {item.category}: {item.percentage}% ({item.count} transactions)
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.outcomeBreakdown.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Where materials went</h2>
          <p className="text-sm text-muted-foreground">Based on reported outcomes only</p>
          <ul className="mt-3 space-y-1 text-sm">
            {data.outcomeBreakdown.map((item) => (
              <li key={item.outcomeType}>
                {item.label}: {item.percentage}%
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Methodology & disclaimer</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Transaction values come from completed Waste2Worth deals, not profit calculations.</li>
          <li>Mass units are normalized where compatible; other units are reported separately.</li>
          <li>Recovery metrics include only buyer-reported outcomes.</li>
          <li>Environmental estimates are not presented as measured laboratory results in this report.</li>
        </ul>
      </section>
    </div>
  )
}
