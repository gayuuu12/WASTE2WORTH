"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireCompleteProfile } from "@/lib/auth"
import {
  getConversationForParticipant,
} from "@/lib/messages/queries"
import { createClient } from "@/lib/supabase/server"
import { sendMessageSchema } from "@/lib/validations/messages"

export type MessageActionResult = {
  error?: string
  success?: boolean
}

export async function sendMessageAction(
  _prev: MessageActionResult,
  formData: FormData,
): Promise<MessageActionResult> {
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const ctx = await requireCompleteProfile()
    const supabase = await createClient()

    const conversation = await getConversationForParticipant(
      supabase,
      parsed.data.conversationId,
      ctx.company.id,
    )

    if (!conversation) {
      return { error: "Conversation not found or access denied." }
    }

    const body = parsed.data.body.trim()
    const now = new Date().toISOString()

    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: parsed.data.conversationId,
      sender_id: ctx.user.id,
      sender_company_id: ctx.company.id,
      body,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ last_message_at: now })
      .eq("id", parsed.data.conversationId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath("/dashboard/messages")
    revalidatePath(`/dashboard/messages/${parsed.data.conversationId}`)

    return { success: true }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err
    }
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}
