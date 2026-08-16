import type { SupabaseClient } from "@supabase/supabase-js"
import type { Conversation, Offer, Transaction, TransactionStatus } from "@/lib/types"
import { NOTIFICATION_TYPES } from "@/lib/notifications/types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/transactions/status"

type NotifyParams = {
  targetCompanyId: string
  type: string
  title: string
  body: string
  link: string
  data: Record<string, string>
}

async function notifyCounterparty(
  supabase: SupabaseClient,
  params: NotifyParams,
) {
  const { error } = await supabase.rpc("notify_marketplace_counterparty", {
    p_target_company_id: params.targetCompanyId,
    p_type: params.type,
    p_title: params.title,
    p_body: params.body,
    p_link: params.link,
    p_data: params.data,
  })

  if (error) {
    console.error("Notification failed:", error.message)
  }
}

export async function notifyOfferReceived(
  supabase: SupabaseClient,
  offer: Pick<Offer, "id" | "supplier_company_id"> & {
    listingTitle?: string | null
  },
) {
  const listingLabel = offer.listingTitle ? ` on "${offer.listingTitle}"` : ""
  await notifyCounterparty(supabase, {
    targetCompanyId: offer.supplier_company_id,
    type: NOTIFICATION_TYPES.OFFER_RECEIVED,
    title: "New offer received",
    body: `A buyer submitted an offer${listingLabel}.`,
    link: `/dashboard/offers/${offer.id}`,
    data: { offer_id: offer.id },
  })
}

export async function notifyOfferAccepted(
  supabase: SupabaseClient,
  offer: Pick<Offer, "id" | "buyer_company_id" | "is_counter">,
) {
  await notifyCounterparty(supabase, {
    targetCompanyId: offer.buyer_company_id,
    type: NOTIFICATION_TYPES.OFFER_ACCEPTED,
    title: "Offer accepted",
    body: "Your offer was accepted. A transaction has been created.",
    link: `/dashboard/offers/${offer.id}`,
    data: { offer_id: offer.id },
  })
}

export async function notifyOfferRejected(
  supabase: SupabaseClient,
  offer: Pick<Offer, "id" | "buyer_company_id">,
) {
  await notifyCounterparty(supabase, {
    targetCompanyId: offer.buyer_company_id,
    type: NOTIFICATION_TYPES.OFFER_REJECTED,
    title: "Offer rejected",
    body: "Your offer was rejected by the supplier.",
    link: `/dashboard/offers/${offer.id}`,
    data: { offer_id: offer.id },
  })
}

export async function notifyCounterofferReceived(
  supabase: SupabaseClient,
  counterOffer: Pick<Offer, "id" | "buyer_company_id" | "parent_offer_id">,
) {
  await notifyCounterparty(supabase, {
    targetCompanyId: counterOffer.buyer_company_id,
    type: NOTIFICATION_TYPES.COUNTEROFFER_RECEIVED,
    title: "Counteroffer received",
    body: "The supplier sent a counteroffer on your offer.",
    link: `/dashboard/offers/${counterOffer.id}`,
    data: { offer_id: counterOffer.id },
  })
}

export async function notifyCounterAccepted(
  supabase: SupabaseClient,
  offer: Pick<Offer, "id" | "supplier_company_id">,
) {
  await notifyCounterparty(supabase, {
    targetCompanyId: offer.supplier_company_id,
    type: NOTIFICATION_TYPES.COUNTER_ACCEPTED,
    title: "Counteroffer accepted",
    body: "The buyer accepted your counteroffer. A transaction has been created.",
    link: `/dashboard/offers/${offer.id}`,
    data: { offer_id: offer.id },
  })
}

export async function notifyCounterRejected(
  supabase: SupabaseClient,
  offer: Pick<Offer, "id" | "supplier_company_id">,
) {
  await notifyCounterparty(supabase, {
    targetCompanyId: offer.supplier_company_id,
    type: NOTIFICATION_TYPES.COUNTER_REJECTED,
    title: "Counteroffer rejected",
    body: "The buyer rejected your counteroffer.",
    link: `/dashboard/offers/${offer.id}`,
    data: { offer_id: offer.id },
  })
}

export async function notifyNewMessage(
  supabase: SupabaseClient,
  conversation: Pick<
    Conversation,
    "id" | "buyer_company_id" | "supplier_company_id"
  >,
  senderCompanyId: string,
  messagePreview: string,
) {
  const targetCompanyId =
    senderCompanyId === conversation.buyer_company_id
      ? conversation.supplier_company_id
      : conversation.buyer_company_id

  const preview =
    messagePreview.length > 120
      ? `${messagePreview.slice(0, 117)}…`
      : messagePreview

  await notifyCounterparty(supabase, {
    targetCompanyId,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title: "New message",
    body: preview,
    link: `/dashboard/messages/${conversation.id}`,
    data: { conversation_id: conversation.id },
  })
}

export async function notifyTransactionStatusChange(
  supabase: SupabaseClient,
  transaction: Pick<
    Transaction,
    "id" | "buyer_company_id" | "supplier_company_id" | "material_name"
  >,
  newStatus: TransactionStatus,
  actorCompanyId: string,
) {
  const targetCompanyId =
    actorCompanyId === transaction.buyer_company_id
      ? transaction.supplier_company_id
      : transaction.buyer_company_id

  const statusLabel = TRANSACTION_STATUS_LABELS[newStatus]

  await notifyCounterparty(supabase, {
    targetCompanyId,
    type: NOTIFICATION_TYPES.TRANSACTION_STATUS,
    title: "Transaction status updated",
    body: `${transaction.material_name}: status changed to ${statusLabel}.`,
    link: `/dashboard/transactions/${transaction.id}`,
    data: { transaction_id: transaction.id },
  })
}
