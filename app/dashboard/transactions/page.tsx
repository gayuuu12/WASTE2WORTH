import { TransactionCard } from "@/components/transactions/transaction-card"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getCompanyTransactions } from "@/lib/transactions/queries"

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
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Accepted offers become transactions. Both parties can track fulfillment here.
        </p>
      </div>

      {buyerTransactions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Purchases</h2>
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
          <h2 className="font-display text-xl font-semibold">Sales</h2>
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
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            No transactions yet. Accept an offer to create a transaction.
          </p>
        </div>
      ) : null}
    </div>
  )
}
