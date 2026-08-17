import type { ImpactPeriod } from "@/lib/impact/constants"
import { MATERIAL_OUTCOME_LABELS } from "@/lib/impact/constants"
import { monthKey, formatMonthLabel } from "@/lib/impact/period"
import type { ImpactTransaction } from "@/lib/impact/queries"
import {
  formatCirculatedSummary,
  formatMassFromKg,
  isMassUnit,
  massToKg,
  sumMassQuantities,
  sumNonMassQuantities,
  type UnitQuantityTotal,
} from "@/lib/impact/units"
import type { CompanyRole, MaterialOutcome, MaterialOutcomeType } from "@/lib/types"

export interface ImpactKpis {
  materialCirculatedSummary: string
  massCirculatedKg: number
  otherUnitTotals: UnitQuantityTotal[]
  economicValueByCurrency: Record<string, number>
  completedTransactions: number
  reportedRecoveryRate: number | null
  outcomeCoverage: { reported: number; eligible: number }
}

export interface ImpactTrendPoint {
  month: string
  label: string
  massKg: number
  transactionCount: number
  valueByCurrency: Record<string, number>
}

export interface CategoryBreakdownItem {
  category: string
  massKg: number
  count: number
  percentage: number
}

export interface OutcomeBreakdownItem {
  outcomeType: MaterialOutcomeType
  label: string
  count: number
  percentage: number
}

export interface ImpactDashboardData {
  kpis: ImpactKpis
  trend: ImpactTrendPoint[]
  categoryBreakdown: CategoryBreakdownItem[]
  outcomeBreakdown: OutcomeBreakdownItem[]
  journeys: ImpactJourneyItem[]
  records: ImpactRecordRow[]
  narrative: string
  role: CompanyRole
}

export interface ImpactJourneyItem {
  transactionId: string
  supplierName: string
  buyerName: string
  materialName: string
  quantityLabel: string
  outcomeLabel: string | null
  resultingProduct: string | null
}

export interface ImpactRecordRow {
  id: string
  date: string
  material: string
  supplier: string
  buyer: string
  transferredLabel: string
  economicValue: number
  currency: string
  outcomeLabel: string | null
  recoveredLabel: string | null
  verificationStatus: string | null
  recoveryPercent: number | null
}

function formatQty(quantity: number, unit: string) {
  return `${quantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`
}

export function computeImpactKpis(
  transactions: ImpactTransaction[],
): ImpactKpis {
  const massItems = transactions.map((t) => ({
    quantity: t.quantity,
    unit: t.quantity_unit,
  }))
  const massKg = sumMassQuantities(massItems)
  const otherUnitTotals = sumNonMassQuantities(massItems)

  const economicValueByCurrency: Record<string, number> = {}
  for (const t of transactions) {
    economicValueByCurrency[t.currency] =
      (economicValueByCurrency[t.currency] ?? 0) + t.total_value
  }

  const withOutcomes = transactions.filter((t) => t.outcome)
  let recoveredMassKg = 0
  let inputMassKg = 0

  for (const t of withOutcomes) {
    const outcome = t.outcome!
    const inputKg = massToKg(outcome.input_quantity, outcome.input_quantity_unit)
    const recoveredKg = massToKg(outcome.recovered_quantity, outcome.recovered_quantity_unit)
    if (inputKg != null && recoveredKg != null) {
      inputMassKg += inputKg
      recoveredMassKg += recoveredKg
    }
  }

  const reportedRecoveryRate =
    inputMassKg > 0 ? Math.round((recoveredMassKg / inputMassKg) * 100) : null

  return {
    materialCirculatedSummary: formatCirculatedSummary(massKg, otherUnitTotals),
    massCirculatedKg: massKg,
    otherUnitTotals,
    economicValueByCurrency,
    completedTransactions: transactions.length,
    reportedRecoveryRate,
    outcomeCoverage: {
      reported: withOutcomes.length,
      eligible: transactions.length,
    },
  }
}

export function computeImpactTrend(
  transactions: ImpactTransaction[],
  months: number | null,
): ImpactTrendPoint[] {
  const byMonth = new Map<string, ImpactTrendPoint>()

  for (const t of transactions) {
    if (!isMassUnit(t.quantity_unit)) continue
    const key = monthKey(new Date(t.updated_at))
    const existing = byMonth.get(key) ?? {
      month: key,
      label: formatMonthLabel(key),
      massKg: 0,
      transactionCount: 0,
      valueByCurrency: {},
    }
    const kg = massToKg(t.quantity, t.quantity_unit) ?? 0
    existing.massKg += kg
    existing.transactionCount += 1
    existing.valueByCurrency[t.currency] =
      (existing.valueByCurrency[t.currency] ?? 0) + t.total_value
    byMonth.set(key, existing)
  }

  let points = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month))
  if (months != null && points.length > months) {
    points = points.slice(-months)
  }
  return points
}

export function computeCategoryBreakdown(
  transactions: ImpactTransaction[],
): CategoryBreakdownItem[] {
  const totals = new Map<string, { massKg: number; count: number }>()

  for (const t of transactions) {
    if (!isMassUnit(t.quantity_unit)) continue
    const category = t.listing?.category?.name ?? "Other"
    const kg = massToKg(t.quantity, t.quantity_unit) ?? 0
    const existing = totals.get(category) ?? { massKg: 0, count: 0 }
    existing.massKg += kg
    existing.count += 1
    totals.set(category, existing)
  }

  const totalMass = [...totals.values()].reduce((sum, item) => sum + item.massKg, 0)
  return [...totals.entries()]
    .map(([category, data]) => ({
      category,
      massKg: data.massKg,
      count: data.count,
      percentage: totalMass > 0 ? Math.round((data.massKg / totalMass) * 100) : 0,
    }))
    .sort((a, b) => b.massKg - a.massKg)
}

export function computeOutcomeBreakdown(
  transactions: ImpactTransaction[],
): OutcomeBreakdownItem[] {
  const withOutcomes = transactions.filter((t) => t.outcome)
  const totals = new Map<MaterialOutcomeType, number>()

  for (const t of withOutcomes) {
    const type = t.outcome!.outcome_type
    totals.set(type, (totals.get(type) ?? 0) + 1)
  }

  const total = withOutcomes.length
  return [...totals.entries()]
    .map(([outcomeType, count]) => ({
      outcomeType,
      label: MATERIAL_OUTCOME_LABELS[outcomeType],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export function buildImpactRecords(transactions: ImpactTransaction[]): ImpactRecordRow[] {
  return transactions.map((t) => {
    const outcome = t.outcome
    const inputKg = outcome ? massToKg(outcome.input_quantity, outcome.input_quantity_unit) : null
    const recoveredKg = outcome
      ? massToKg(outcome.recovered_quantity, outcome.recovered_quantity_unit)
      : null
    const recoveryPercent =
      inputKg != null && recoveredKg != null && inputKg > 0
        ? Math.round((recoveredKg / inputKg) * 100)
        : null

    return {
      id: t.id,
      date: t.updated_at,
      material: t.material_name,
      supplier: t.supplier?.name ?? "Supplier",
      buyer: t.buyer?.name ?? "Buyer",
      transferredLabel: formatQty(t.quantity, t.quantity_unit),
      economicValue: t.total_value,
      currency: t.currency,
      outcomeLabel: outcome ? MATERIAL_OUTCOME_LABELS[outcome.outcome_type] : null,
      recoveredLabel: outcome
        ? formatQty(outcome.recovered_quantity, outcome.recovered_quantity_unit)
        : null,
      verificationStatus: outcome?.verification_status ?? null,
      recoveryPercent,
    }
  })
}

export function buildImpactJourneys(transactions: ImpactTransaction[]): ImpactJourneyItem[] {
  return transactions.slice(0, 8).map((t) => ({
    transactionId: t.id,
    supplierName: t.supplier?.name ?? "Supplier",
    buyerName: t.buyer?.name ?? "Buyer",
    materialName: t.material_name,
    quantityLabel: formatQty(t.quantity, t.quantity_unit),
    outcomeLabel: t.outcome ? MATERIAL_OUTCOME_LABELS[t.outcome.outcome_type] : null,
    resultingProduct: t.outcome?.resulting_product ?? null,
  }))
}

export function buildImpactNarrative(
  kpis: ImpactKpis,
  role: CompanyRole,
  period: ImpactPeriod,
): string {
  const periodLabel =
    period === "this_year"
      ? "this year"
      : period === "all_time"
        ? "to date"
        : "in the selected period"

  const deals = kpis.completedTransactions
  const circulated = kpis.materialCirculatedSummary

  if (deals === 0) {
    return "Complete your first Waste2Worth transaction to start building your circular impact history."
  }

  if (role === "supplier") {
    return `Your company circulated ${circulated} of surplus material through Waste2Worth across ${deals} completed ${deals === 1 ? "deal" : "deals"} ${periodLabel}.`
  }
  if (role === "buyer") {
    return `Your company sourced ${circulated} of secondary material through Waste2Worth across ${deals} completed ${deals === 1 ? "deal" : "deals"} ${periodLabel}.`
  }
  return `Your company participated in ${deals} completed material exchanges ${periodLabel}, circulating ${circulated} of secondary material through Waste2Worth.`
}

export function buildImpactDashboardData(
  transactions: ImpactTransaction[],
  role: CompanyRole,
  period: ImpactPeriod,
  trendMonths: number | null = 12,
): ImpactDashboardData {
  const kpis = computeImpactKpis(transactions)
  return {
    kpis,
    trend: computeImpactTrend(transactions, trendMonths),
    categoryBreakdown: computeCategoryBreakdown(transactions),
    outcomeBreakdown: computeOutcomeBreakdown(transactions),
    journeys: buildImpactJourneys(transactions),
    records: buildImpactRecords(transactions),
    narrative: buildImpactNarrative(kpis, role, period),
    role,
  }
}

export function formatEconomicTotals(totals: Record<string, number>): string {
  const entries = Object.entries(totals)
  if (entries.length === 0) return "—"
  return entries
    .map(([currency, amount]) => {
      const symbol =
        currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency
      return `${symbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    })
    .join(" · ")
}

export function estimateWasteDivertedKg(outcome: MaterialOutcome | null): number | null {
  if (!outcome) return null
  return massToKg(outcome.recovered_quantity, outcome.recovered_quantity_unit)
}

/** CO₂e estimates require documented factors — not auto-calculated in Phase 6C. */
export function getCo2EstimateStatus(): "unavailable" {
  return "unavailable"
}

export { formatMassFromKg }
