import Link from "next/link"
import type { Transaction } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TransactionCard({
  transaction,
  perspective,
}: {
  transaction: Transaction
  perspective: "buyer" | "supplier"
}) {
  const listingTitle = transaction.listing?.title ?? "Listing"

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{listingTitle}</CardTitle>
          <TransactionStatusBadge status={transaction.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {perspective === "supplier" ? "Buyer deal" : "Supplier deal"}
        </p>
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
          <span className="text-muted-foreground">Agreed price:</span>{" "}
          {formatMoney(transaction.agreed_price, transaction.currency)}
        </p>
        <p className="text-muted-foreground">
          Created {formatDate(transaction.created_at)}
        </p>
      </CardContent>
      <CardFooter>
        <Link
          href={`/dashboard/transactions/${transaction.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View transaction
        </Link>
      </CardFooter>
    </Card>
  )
}
