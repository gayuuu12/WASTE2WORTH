"use client"

import { useActionState, useEffect, useRef } from "react"
import {
  sendMessageAction,
  type MessageActionResult,
} from "@/lib/actions/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: MessageActionResult = {}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction, pending] = useActionState(sendMessageAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2">
        <Input
          name="body"
          placeholder="Type a message..."
          disabled={pending}
          autoComplete="off"
          maxLength={4000}
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
