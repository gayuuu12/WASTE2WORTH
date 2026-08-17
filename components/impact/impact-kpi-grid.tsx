import type { ImpactKpis } from "@/lib/impact/metrics"
import { formatEconomicTotals } from "@/lib/impact/metrics"
import type { CompanyRole } from "@/lib/types"
import { StatCard } from "@/components/ui/stat-card"

export function ImpactKpiGrid({
  kpis,
  role,
}: {
  kpis: ImpactKpis
  role: CompanyRole
}) {
  const circulatedLabel =
    role === "supplier"
      ? "Material circulated"
      : role === "buyer"
        ? "Secondary material sourced"
        : "Material circulated"

  const valueLabel =
    role === "supplier" ? "Value recovered from surplus" : "Transaction value created"

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={circulatedLabel}
        value={kpis.materialCirculatedSummary}
        description="Completed transactions · mass units normalized where compatible"
      />
      <StatCard
        label={valueLabel}
        value={formatEconomicTotals(kpis.economicValueByCurrency)}
        description="By currency · transaction value through Waste2Worth"
      />
      <StatCard
        label="Completed circular transactions"
        value={kpis.completedTransactions}
      />
      <StatCard
        label="Reported recovery rate"
        value={
          kpis.reportedRecoveryRate != null ? `${kpis.reportedRecoveryRate}%` : "—"
        }
        description={
          kpis.outcomeCoverage.eligible > 0
            ? `Based on ${kpis.outcomeCoverage.reported} of ${kpis.outcomeCoverage.eligible} reported outcomes`
            : "Report outcomes to calculate"
        }
      />
    </div>
  )
}
