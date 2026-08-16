import { notFound } from "next/navigation"
import { ConversationView } from "@/components/messages/conversation-view"
import { requireCompleteProfile } from "@/lib/auth"
import {
  getCompanyNamesByIds,
  getConversationForParticipant,
  getMessagesForConversation,
} from "@/lib/messages/queries"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const conversation = await getConversationForParticipant(
    supabase,
    id,
    ctx.company.id,
  )
  if (!conversation) {
    notFound()
  }

  const messages = await getMessagesForConversation(supabase, id)

  const counterpartyId =
    conversation.buyer_company_id === ctx.company.id
      ? conversation.supplier_company_id
      : conversation.buyer_company_id

  const companyNames = await getCompanyNamesByIds(supabase, [
    counterpartyId,
    ctx.company.id,
  ])

  return (
    <ConversationView
      conversation={conversation}
      messages={messages}
      counterpartyName={companyNames[counterpartyId] ?? "Company"}
      ownCompanyName={companyNames[ctx.company.id] ?? ctx.company.name}
      ownCompanyId={ctx.company.id}
    />
  )
}
