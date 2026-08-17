import { TransactionCard } from "@/components/transactions/transaction-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getCompanyTransactions } from "@/lib/transactions/queries"
import { ArrowLeftRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const transactions = await getCompanyTransactions(supabase, ctx.company.id)

  const buyerTransactions = transactions.filter(
    (transaction) => transaction.buyer_company_id === ctx.company.id,
  )
  const supplierTransactions = transactions.filter(
    (transaction) => transaction.supplier_company_id === ctx.company.id,
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Accepted offers become transactions. Both parties can track fulfillment here."
      />

      {buyerTransactions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Purchases</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {buyerTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                perspective="buyer"
              />
            ))}
          </div>
        </section>
      ) : null}

      {supplierTransactions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Sales</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {supplierTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                perspective="supplier"
              />
            ))}
          </div>
        </section>
      ) : null}

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Accept an offer to create a transaction and track fulfillment here."
          icon={<ArrowLeftRight className="size-5" aria-hidden />}
        />
      ) : null}
    </div>
  )
}
