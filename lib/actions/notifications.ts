"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireCompleteProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type NotificationActionResult = {
  error?: string
  success?: boolean
}

const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Invalid notification"),
})

export async function markNotificationReadAction(
  _prev: NotificationActionResult,
  formData: FormData,
): Promise<NotificationActionResult> {
  const parsed = notificationIdSchema.safeParse({
    notificationId: formData.get("notificationId"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", parsed.data.notificationId)
      .eq("user_id", ctx.user.id)
      .is("read_at", null)
      .select("id")
      .maybeSingle()

    if (error) {
      return { error: error.message }
    }

    if (!data) {
      return { error: "Notification not found or already read." }
    }

    revalidatePath("/dashboard/notifications")
    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function markNotificationReadFormAction(formData: FormData) {
  await markNotificationReadAction({}, formData)
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  try {
    const ctx = await requireCompleteProfile()
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", ctx.user.id)
      .is("read_at", null)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/dashboard/notifications")
    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function markAllNotificationsReadFormAction() {
  await markAllNotificationsReadAction()
}
