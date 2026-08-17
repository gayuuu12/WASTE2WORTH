"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getTransactionForParticipant } from "@/lib/transactions/queries"
import { materialOutcomeFormSchema, supplierConfirmOutcomeSchema } from "@/lib/validations/material-outcomes"

export type MaterialOutcomeActionResult = {
  error?: string
  success?: boolean
}

export async function saveMaterialOutcomeAction(
  _prev: MaterialOutcomeActionResult,
  formData: FormData,
): Promise<MaterialOutcomeActionResult> {
  const parsed = materialOutcomeFormSchema.safeParse({
    transactionId: formData.get("transactionId"),
    outcomeType: formData.get("outcomeType"),
    inputQuantity: formData.get("inputQuantity"),
    inputQuantityUnit: formData.get("inputQuantityUnit"),
    recoveredQuantity: formData.get("recoveredQuantity"),
    recoveredQuantityUnit: formData.get("recoveredQuantityUnit"),
    resultingProduct: formData.get("resultingProduct") || undefined,
    resultingProductCategory: formData.get("resultingProductCategory") || undefined,
    processingMethod: formData.get("processingMethod") || undefined,
    notes: formData.get("notes") || undefined,
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

    if (transaction.buyer_company_id !== ctx.company.id) {
      return { error: "Only the buyer company can record material outcomes." }
    }

    if (transaction.status !== "completed") {
      return { error: "Outcomes can only be recorded for completed transactions." }
    }

    if (
      parsed.data.inputQuantityUnit !== transaction.quantity_unit ||
      parsed.data.recoveredQuantityUnit !== transaction.quantity_unit
    ) {
      return { error: "Outcome quantities must use the same unit as the transaction." }
    }

    const payload = {
      transaction_id: transaction.id,
      buyer_company_id: transaction.buyer_company_id,
      supplier_company_id: transaction.supplier_company_id,
      outcome_type: parsed.data.outcomeType,
      input_quantity: parsed.data.inputQuantity,
      input_quantity_unit: parsed.data.inputQuantityUnit,
      recovered_quantity: parsed.data.recoveredQuantity,
      recovered_quantity_unit: parsed.data.recoveredQuantityUnit,
      resulting_product: parsed.data.resultingProduct ?? null,
      resulting_product_category: parsed.data.resultingProductCategory ?? null,
      processing_method: parsed.data.processingMethod ?? null,
      notes: parsed.data.notes ?? null,
      verification_status: "buyer_reported" as const,
    }

    const { error } = await supabase.from("material_outcomes").upsert(payload, {
      onConflict: "transaction_id",
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/dashboard/impact")
    revalidatePath(`/dashboard/impact/${transaction.id}`)
    revalidatePath(`/dashboard/transactions/${transaction.id}`)

    redirect(`/dashboard/transactions/${transaction.id}?outcome=1`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "Could not save material outcome.",
    }
  }
}

export async function confirmMaterialOutcomeAction(
  _prev: MaterialOutcomeActionResult,
  formData: FormData,
): Promise<MaterialOutcomeActionResult> {
  const parsed = supplierConfirmOutcomeSchema.safeParse({
    outcomeId: formData.get("outcomeId"),
    transactionId: formData.get("transactionId"),
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

    if (!transaction || transaction.supplier_company_id !== ctx.company.id) {
      return { error: "Only the supplier can confirm a reported outcome." }
    }

    const { error } = await supabase
      .from("material_outcomes")
      .update({ verification_status: "supplier_confirmed" })
      .eq("id", parsed.data.outcomeId)
      .eq("supplier_company_id", ctx.company.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/dashboard/impact")
    revalidatePath(`/dashboard/impact/${transaction.id}`)
    revalidatePath(`/dashboard/transactions/${transaction.id}`)

    redirect(`/dashboard/transactions/${transaction.id}?outcome=1`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "Could not confirm material outcome.",
    }
  }
}
