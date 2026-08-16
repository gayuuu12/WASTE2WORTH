import type { SupabaseClient } from "@supabase/supabase-js"
import type { Conversation, Message } from "@/lib/types"

const CONVERSATION_SELECT = `
  *,
  listing:waste_listings!listing_id(
    id,
    title,
    material_name
  )
`

export async function getConversationsForCompany(
  supabase: SupabaseClient,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .order("last_message_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Conversation[]
}

export async function getConversationForParticipant(
  supabase: SupabaseClient,
  conversationId: string,
  companyId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .or(`buyer_company_id.eq.${companyId},supplier_company_id.eq.${companyId}`)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Conversation | null
}

export async function getMessagesForConversation(
  supabase: SupabaseClient,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Message[]
}

export async function getLatestMessagesByConversation(
  supabase: SupabaseClient,
  conversationIds: string[],
) {
  const latest = new Map<string, Pick<Message, "conversation_id" | "body" | "created_at">>()
  if (conversationIds.length === 0) {
    return latest
  }

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  for (const message of data ?? []) {
    if (!latest.has(message.conversation_id)) {
      latest.set(message.conversation_id, message)
    }
  }

  return latest
}

export async function getCompanyNamesByIds(
  supabase: SupabaseClient,
  companyIds: string[],
) {
  const uniqueIds = [...new Set(companyIds)]
  if (uniqueIds.length === 0) {
    return {} as Record<string, string>
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", uniqueIds)

  if (error) {
    throw new Error(error.message)
  }

  return Object.fromEntries((data ?? []).map((row) => [row.id, row.name])) as Record<
    string,
    string
  >
}

export async function findConversationForParticipants(
  supabase: SupabaseClient,
  buyerCompanyId: string,
  supplierCompanyId: string,
  listingId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_company_id", buyerCompanyId)
    .eq("supplier_company_id", supplierCompanyId)
    .eq("listing_id", listingId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.id as string | undefined
}

export async function findOrCreateConversationForTransaction(
  supabase: SupabaseClient,
  params: {
    listingId: string
    buyerCompanyId: string
    supplierCompanyId: string
    currentCompanyId: string
  },
) {
  const { listingId, buyerCompanyId, supplierCompanyId, currentCompanyId } = params

  if (
    currentCompanyId !== buyerCompanyId &&
    currentCompanyId !== supplierCompanyId
  ) {
    throw new Error("You are not a participant in this transaction.")
  }

  const existing = await findConversationForParticipants(
    supabase,
    buyerCompanyId,
    supplierCompanyId,
    listingId,
  )
  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_company_id: buyerCompanyId,
      supplier_company_id: supplierCompanyId,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      const retry = await findConversationForParticipants(
        supabase,
        buyerCompanyId,
        supplierCompanyId,
        listingId,
      )
      if (retry) {
        return retry
      }
    }
    throw new Error(error.message)
  }

  return data.id as string
}
