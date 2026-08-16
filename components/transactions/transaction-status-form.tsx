"use client"

import { useActionState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  updateTransactionStatusAction,
  type TransactionActionResult,
} from "@/lib/actions/transactions"
import {
  getNextTransactionStatuses,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/transactions/status"
import type { Transaction, TransactionStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"

const initialState: TransactionActionResult = {}

export function TransactionStatusForm({
  transaction,
}: {
  transaction: Transaction
}) {
  const [state, formAction, pending] = useActionState(
    updateTransactionStatusAction,
    initialState,
  )
  const nextStatuses = getNextTransactionStatuses(transaction.status)

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further status updates are available for this transaction.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Update transaction status</p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <form key={status} action={formAction}>
            <input type="hidden" name="transactionId" value={transaction.id} />
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              variant={status === "cancelled" || status === "disputed" ? "outline" : "default"}
              size="sm"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                TRANSACTION_STATUS_LABELS[status as TransactionStatus]
              )}
            </Button>
          </form>
        ))}
      </div>
    </div>
  )
}
