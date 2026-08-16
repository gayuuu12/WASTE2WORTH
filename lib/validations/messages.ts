import { z } from "zod"

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation"),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
