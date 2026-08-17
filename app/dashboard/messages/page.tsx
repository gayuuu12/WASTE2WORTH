import { ConversationCard } from "@/components/messages/conversation-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"
import {
  getCompanyNamesByIds,
  getConversationsForCompany,
  getLatestMessagesByConversation,
} from "@/lib/messages/queries"
import { createClient } from "@/lib/supabase/server"
import { MessageSquare } from "lucide-react"

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
      <PageHeader
        title="Messages"
        description="Business conversations with buyers and suppliers on your deals."
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Messages related to your transactions will appear here."
          icon={<MessageSquare className="size-5" aria-hidden />}
        />
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
