import { notFound, redirect } from "next/navigation"
import { requireCompleteProfile } from "@/lib/auth"
import { findOrCreateConversationForTransaction } from "@/lib/messages/queries"
import { getTransactionForParticipant } from "@/lib/transactions/queries"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function OpenConversationFromTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const transaction = await getTransactionForParticipant(
    supabase,
    id,
    ctx.company.id,
  )
  if (!transaction) {
    notFound()
  }

  const conversationId = await findOrCreateConversationForTransaction(supabase, {
    listingId: transaction.listing_id,
    buyerCompanyId: transaction.buyer_company_id,
    supplierCompanyId: transaction.supplier_company_id,
    currentCompanyId: ctx.company.id,
  })

  redirect(`/dashboard/messages/${conversationId}`)
}
