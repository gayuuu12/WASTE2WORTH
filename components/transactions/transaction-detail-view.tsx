import Link from "next/link"
import type { Transaction, TransactionStatus } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { TRANSACTION_STATUS_LABELS } from "@/lib/transactions/status"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STATUS_FLOW: TransactionStatus[] = [
  "agreed",
  "in_transit",
  "delivered",
  "completed",
]

export function TransactionDetailView({
  transaction,
  viewerRole,
}: {
  transaction: Transaction
  viewerRole: "buyer" | "supplier"
}) {
  const currentIndex = STATUS_FLOW.indexOf(transaction.status)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Transaction</h1>
        <TransactionStatusBadge status={transaction.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap gap-2 text-sm">
            {STATUS_FLOW.map((status, index) => {
              const reached =
                transaction.status === status ||
                (currentIndex >= 0 && index <= currentIndex) ||
                transaction.status === "completed"
              const isTerminal =
                transaction.status === "cancelled" ||
                transaction.status === "disputed"

              return (
                <li
                  key={status}
                  className={
                    reached && !isTerminal
                      ? "rounded-md bg-primary/10 px-2 py-1 font-medium"
                      : "rounded-md px-2 py-1 text-muted-foreground"
                  }
                >
                  {TRANSACTION_STATUS_LABELS[status]}
                </li>
              )
            })}
          </ol>
          {transaction.status === "cancelled" || transaction.status === "disputed" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Final status: {TRANSACTION_STATUS_LABELS[transaction.status]}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Material:</span>{" "}
              {transaction.material_name}
            </p>
            <p>
              <span className="text-muted-foreground">Quantity:</span>{" "}
              {formatQuantity(transaction.quantity, transaction.quantity_unit)}
            </p>
            <p>
              <span className="text-muted-foreground">Agreed unit price:</span>{" "}
              {formatMoney(transaction.agreed_price, transaction.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Total value:</span>{" "}
              {formatMoney(transaction.total_value, transaction.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Created:</span>{" "}
              {formatDate(transaction.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{transaction.listing?.title ?? "—"}</p>
            {transaction.listing?.material_name ? (
              <p>
                <span className="text-muted-foreground">Material:</span>{" "}
                {transaction.listing.material_name}
              </p>
            ) : null}
            {transaction.offer_id ? (
              <p>
                <span className="text-muted-foreground">Accepted offer:</span>{" "}
                <Link
                  href={`/dashboard/offers/${transaction.offer_id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  View offer
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {viewerRole === "buyer" ? "Your purchase" : "Your sale"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You are viewing this transaction as the{" "}
          {viewerRole === "buyer" ? "buyer" : "supplier"} company.
        </CardContent>
      </Card>
    </div>
  )
}
