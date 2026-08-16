"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function NotificationNavLink({
  initialUnreadCount,
  userId,
}: {
  initialUnreadCount: number
  userId: string
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((count) => count + 1)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as { read_at: string | null }
          const previous = payload.old as { read_at: string | null }
          if (previous?.read_at === null && updated.read_at !== null) {
            setUnreadCount((count) => Math.max(0, count - 1))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const label =
    unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications"

  return (
    <Link
      href="/dashboard/notifications"
      className={cn(
        "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
        unreadCount > 0 && "font-medium text-foreground",
      )}
    >
      {label}
    </Link>
  )
}
