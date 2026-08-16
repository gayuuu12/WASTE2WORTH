import type { TransactionStatus } from "@/lib/types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/transactions/status"
import { Badge } from "@/components/ui/badge"

const STATUS_VARIANT: Record<
  TransactionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  agreed: "secondary",
  in_transit: "outline",
  delivered: "outline",
  completed: "default",
  cancelled: "destructive",
  disputed: "destructive",
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  )
}
