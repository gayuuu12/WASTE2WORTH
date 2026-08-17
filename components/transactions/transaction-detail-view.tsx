import Link from "next/link"
import type { Transaction, TransactionStatus } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { TRANSACTION_STATUS_LABELS } from "@/lib/transactions/status"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

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
  const isTerminal =
    transaction.status === "cancelled" || transaction.status === "disputed"

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Transaction
        </h1>
        <TransactionStatusBadge status={transaction.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fulfillment progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isTerminal ? (
            <p className="text-sm text-muted-foreground">
              Final status: {TRANSACTION_STATUS_LABELS[transaction.status]}
            </p>
          ) : (
            <ol className="relative space-y-0">
              {STATUS_FLOW.map((status, index) => {
                const isCurrent = transaction.status === status
                const isComplete =
                  currentIndex >= 0 && index < currentIndex
                const isReached = isCurrent || isComplete

                return (
                  <li key={status} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                          isCurrent
                            ? "border-primary bg-primary text-primary-foreground"
                            : isReached
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground",
                        )}
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        {isComplete ? (
                          <Check className="size-4" aria-hidden />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < STATUS_FLOW.length - 1 ? (
                        <div
                          className={cn(
                            "mt-1 w-0.5 flex-1 min-h-6",
                            isComplete ? "bg-primary" : "bg-border",
                          )}
                        />
                      ) : null}
                    </div>
                    <div className="pt-1">
                      <p
                        className={cn(
                          "font-medium",
                          isCurrent ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {TRANSACTION_STATUS_LABELS[status]}
                      </p>
                      {isCurrent ? (
                        <p className="text-sm text-primary">Current stage</p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
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
              <span className="text-muted-foreground">Unit price:</span>{" "}
              {formatMoney(transaction.agreed_price, transaction.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Total value:</span>{" "}
              {formatMoney(transaction.total_value, transaction.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Buyer:</span>{" "}
              {transaction.buyer?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Supplier:</span>{" "}
              {transaction.supplier?.name ?? "—"}
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
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  View offer
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        You are viewing this transaction as the{" "}
        {viewerRole === "buyer" ? "buyer" : "supplier"} company.
      </p>
    </div>
  )
}
