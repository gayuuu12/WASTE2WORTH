import Link from "next/link"
import { notFound } from "next/navigation"
import { TransactionDetailView } from "@/components/transactions/transaction-detail-view"
import { TransactionStatusForm } from "@/components/transactions/transaction-status-form"
import {
  MaterialOutcomeForm,
  SupplierConfirmOutcomeForm,
} from "@/components/impact/material-outcome-form"
import { getMaterialOutcomeForTransaction } from "@/lib/impact/queries"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { getTransactionForParticipant } from "@/lib/transactions/queries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const rawParams = await searchParams
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const transaction = await getTransactionForParticipant(supabase, id, ctx.company.id)
  if (!transaction) {
    notFound()
  }

  const viewerRole =
    transaction.buyer_company_id === ctx.company.id ? "buyer" : "supplier"
  const justCreated = rawParams.created === "1"
  const justUpdated = rawParams.updated === "1"
  const outcomeSaved = rawParams.outcome === "1"

  const outcome =
    transaction.status === "completed"
      ? await getMaterialOutcomeForTransaction(supabase, transaction.id)
      : null

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/transactions"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to transactions
      </Link>

      {justCreated ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Transaction created from the accepted offer.
        </div>
      ) : null}

      {justUpdated ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Transaction status updated.
        </div>
      ) : null}

      {outcomeSaved ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Material outcome saved.
        </div>
      ) : null}

      <TransactionDetailView transaction={transaction} viewerRole={viewerRole} />

      {transaction.status === "completed" ? (
        <div className="space-y-4">
          {viewerRole === "buyer" ? (
            <MaterialOutcomeForm transaction={transaction} existingOutcome={outcome} />
          ) : outcome ? (
            <div className="rounded-lg border border-border p-4 text-sm">
              <p className="font-medium">Buyer-reported outcome on file</p>
              <SupplierConfirmOutcomeForm outcome={outcome} transactionId={transaction.id} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Waiting for the buyer to report downstream material outcomes.
            </div>
          )}
          <Link
            href={`/dashboard/impact/${transaction.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View material journey
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/transactions/${transaction.id}/message`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          {viewerRole === "buyer" ? "Message Supplier" : "Message Buyer"}
        </Link>
      </div>

      <div className="rounded-lg border border-border p-4">
        <TransactionStatusForm transaction={transaction} />
      </div>
    </div>
  )
}
