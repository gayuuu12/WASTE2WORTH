import type { TransactionStatus } from "@/lib/types"

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  agreed: "Agreed",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
}

/** Conservative manual flow using schema-supported statuses only. */
export const TRANSACTION_STATUS_TRANSITIONS: Record<
  TransactionStatus,
  TransactionStatus[]
> = {
  agreed: ["in_transit", "cancelled", "disputed"],
  in_transit: ["delivered", "cancelled", "disputed"],
  delivered: ["completed", "disputed"],
  completed: [],
  cancelled: [],
  disputed: [],
}

export function canTransitionTransactionStatus(
  from: TransactionStatus,
  to: TransactionStatus,
): boolean {
  return TRANSACTION_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextTransactionStatuses(
  current: TransactionStatus,
): TransactionStatus[] {
  return TRANSACTION_STATUS_TRANSITIONS[current] ?? []
}
