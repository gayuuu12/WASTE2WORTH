import { ConversationCard } from "@/components/messages/conversation-card"
import { requireCompleteProfile } from "@/lib/auth"
import {
  getCompanyNamesByIds,
  getConversationsForCompany,
  getLatestMessagesByConversation,
} from "@/lib/messages/queries"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const conversations = await getConversationsForCompany(supabase, ctx.company.id)
  const latestByConversation = await getLatestMessagesByConversation(
    supabase,
    conversations.map((c) => c.id),
  )

  const counterpartyIds = conversations.map((c) =>
    c.buyer_company_id === ctx.company.id
      ? c.supplier_company_id
      : c.buyer_company_id,
  )
  const companyNames = await getCompanyNamesByIds(supabase, counterpartyIds)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Conversations with buyers and suppliers on your transactions.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No conversations yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {conversations.map((conversation) => {
            const counterpartyId =
              conversation.buyer_company_id === ctx.company.id
                ? conversation.supplier_company_id
                : conversation.buyer_company_id
            const latest = latestByConversation.get(conversation.id)

            return (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                counterpartyName={companyNames[counterpartyId] ?? "Company"}
                latestMessageBody={latest?.body ?? null}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
