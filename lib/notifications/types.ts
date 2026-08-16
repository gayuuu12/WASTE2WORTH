export const NOTIFICATION_TYPES = {
  OFFER_RECEIVED: "offer_received",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_REJECTED: "offer_rejected",
  COUNTEROFFER_RECEIVED: "counteroffer_received",
  COUNTER_ACCEPTED: "counter_accepted",
  COUNTER_REJECTED: "counter_rejected",
  NEW_MESSAGE: "new_message",
  TRANSACTION_STATUS: "transaction_status",
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export function isSafeNotificationLink(link: string | null): link is string {
  if (!link) return false
  return link.startsWith("/dashboard/")
}
