import type { SupabaseClient } from "@supabase/supabase-js"
import type { Notification } from "@/lib/types"

export async function getNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const notifications = (data ?? []) as Notification[]

  return notifications.sort((a, b) => {
    const aUnread = a.read_at === null
    const bUnread = b.read_at === null
    if (aUnread !== bUnread) {
      return aUnread ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null)

  if (error) {
    throw new Error(error.message)
  }

  return count ?? 0
}
