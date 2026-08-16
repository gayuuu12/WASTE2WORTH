import { z } from "zod"

const TRANSACTION_STATUSES = [
  "agreed",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
] as const

export const transactionStatusSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction"),
  status: z.enum(TRANSACTION_STATUSES, { message: "Invalid status" }),
})

export type TransactionStatusInput = z.infer<typeof transactionStatusSchema>
