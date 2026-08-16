"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getTransactionForParticipant } from "@/lib/transactions/queries"
import { notifyTransactionStatusChange } from "@/lib/notifications/create"
import {
  canTransitionTransactionStatus,
  getNextTransactionStatuses,
} from "@/lib/transactions/status"
import type { TransactionStatus } from "@/lib/types"
import { transactionStatusSchema } from "@/lib/validations/transactions"

export type TransactionActionResult = {
  error?: string
  success?: boolean
}

export async function updateTransactionStatusAction(
  _prev: TransactionActionResult,
  formData: FormData,
): Promise<TransactionActionResult> {
  const parsed = transactionStatusSchema.safeParse({
    transactionId: formData.get("transactionId"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const supabase = await createClient()

    const transaction = await getTransactionForParticipant(
      supabase,
      parsed.data.transactionId,
      ctx.company.id,
    )

    if (!transaction) {
      return { error: "Transaction not found or access denied." }
    }

    const currentStatus = transaction.status as TransactionStatus
    const nextStatus = parsed.data.status as TransactionStatus

    if (!canTransitionTransactionStatus(currentStatus, nextStatus)) {
      return {
        error: `Cannot change status from ${currentStatus} to ${nextStatus}.`,
      }
    }

    const allowed = getNextTransactionStatuses(currentStatus)
    if (!allowed.includes(nextStatus)) {
      return { error: "That status transition is not allowed." }
    }

    const { data, error } = await supabase
      .from("transactions")
      .update({ status: nextStatus })
      .eq("id", transaction.id)
      .eq("status", currentStatus)
      .select("id")
      .maybeSingle()

    if (error) {
      return { error: error.message }
    }

    if (!data) {
      return { error: "Transaction status has already changed. Refresh and try again." }
    }

    await notifyTransactionStatusChange(
      supabase,
      transaction,
      nextStatus,
      ctx.company.id,
    )

    revalidatePath("/dashboard/transactions")
    revalidatePath(`/dashboard/transactions/${transaction.id}`)

    redirect(`/dashboard/transactions/${transaction.id}?updated=1`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error:
        error instanceof Error ? error.message : "Could not update transaction status.",
    }
  }
}
