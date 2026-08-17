import Link from "next/link"
import { notFound } from "next/navigation"
import { requireCompleteProfile } from "@/lib/auth"
import { MATERIAL_OUTCOME_LABELS, VERIFICATION_STATUS_LABELS } from "@/lib/impact/constants"
import {
  estimateWasteDivertedKg,
  formatMassFromKg,
  getCo2EstimateStatus,
} from "@/lib/impact/metrics"
import { getImpactTransactionDetail } from "@/lib/impact/queries"
import { createClient } from "@/lib/supabase/server"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowDown } from "lucide-react"

export default async function ImpactJourneyDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>
}) {
  const { transactionId } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const transaction = await getImpactTransactionDetail(supabase, transactionId, ctx.company.id)

  if (!transaction || transaction.status !== "completed") {
    notFound()
  }

  const outcome = transaction.outcome ?? null
  const supplierLocation = [transaction.supplier?.city, transaction.supplier?.state]
    .filter(Boolean)
    .join(", ")
  const wasteDiverted = outcome ? estimateWasteDivertedKg(outcome) : null
  const recoveryPercent =
    outcome && outcome.input_quantity > 0
      ? Math.round((outcome.recovered_quantity / outcome.input_quantity) * 100)
      : null

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/impact"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to Circular Impact
      </Link>

      <PageHeader
        title="Material journey"
        description={`${transaction.material_name} · completed ${formatDate(transaction.updated_at)}`}
      />

      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
          <p className="text-lg font-semibold">{transaction.supplier?.name ?? "Supplier"}</p>
          <p className="text-sm text-muted-foreground">{supplierLocation || "Location not specified"}</p>
        </section>

        <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />

        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Material</p>
          <p className="text-lg font-semibold">{transaction.material_name}</p>
          <p className="text-sm text-muted-foreground">
            {formatQuantity(transaction.quantity, transaction.quantity_unit)}
          </p>
        </section>

        <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />

        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Marketplace transaction
          </p>
          <p className="text-sm">
            Agreed value: {formatMoney(transaction.total_value, transaction.currency)}
          </p>
          <p className="text-sm text-muted-foreground">
            Completed: {formatDate(transaction.updated_at)}
          </p>
          <Badge variant="secondary">Transaction verified</Badge>
        </section>

        <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />

        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination</p>
          <p className="text-lg font-semibold">{transaction.buyer?.name ?? "Buyer"}</p>
        </section>

        {outcome ? (
          <>
            <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reported outcome
              </p>
              <p className="font-medium">{MATERIAL_OUTCOME_LABELS[outcome.outcome_type]}</p>
              {outcome.resulting_product ? (
                <p className="text-sm">{outcome.resulting_product}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                Recovered: {formatQuantity(outcome.recovered_quantity, outcome.recovered_quantity_unit)}
              </p>
              <Badge variant="outline">
                {VERIFICATION_STATUS_LABELS[outcome.verification_status]}
              </Badge>
            </section>

            <section className="rounded-lg bg-muted/40 p-4 text-sm">
              <p className="font-medium">Impact summary</p>
              {recoveryPercent != null ? (
                <p className="mt-1">{recoveryPercent}% reported recovery</p>
              ) : null}
              {wasteDiverted != null ? (
                <p className="text-muted-foreground">
                  Estimated waste diverted: {formatMassFromKg(wasteDiverted)}{" "}
                  <span className="text-xs">(Estimated · buyer-reported recovered mass)</span>
                </p>
              ) : null}
              {getCo2EstimateStatus() === "unavailable" ? (
                <p className="mt-1 text-muted-foreground">CO₂e estimate unavailable</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Unreported material is not assumed to be landfilled — only the submitted recovery
                quantity is reflected here.
              </p>
            </section>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No buyer-reported outcome yet.</p>
        )}
      </div>
    </div>
  )
}
