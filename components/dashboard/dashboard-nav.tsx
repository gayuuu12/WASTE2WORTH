"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import {
  getDashboardNavGroups,
  isNavItemActive,
  type DashboardNavGroup,
} from "@/components/dashboard/dashboard-nav-config"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function NotificationNavItem({
  pathname,
  initialUnreadCount,
  userId,
  onNavigate,
}: {
  pathname: string
  initialUnreadCount: number
  userId: string
  onNavigate?: () => void
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const active =
    pathname === "/dashboard/notifications" ||
    pathname.startsWith("/dashboard/notifications/")

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

  return (
    <li>
      <Link
        href="/dashboard/notifications"
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <Bell className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">Notifications</span>
        {unreadCount > 0 ? (
          <span
            className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground tabular"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

function NavGroups({
  groups,
  pathname,
  unreadNotificationCount,
  userId,
  onNavigate,
}: {
  groups: DashboardNavGroup[]
  pathname: string
  unreadNotificationCount: number
  userId: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Dashboard">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              if (item.href === "/dashboard/notifications") {
                return (
                  <NotificationNavItem
                    key={item.href}
                    pathname={pathname}
                    initialUnreadCount={unreadNotificationCount}
                    userId={userId}
                    onNavigate={onNavigate}
                  />
                )
              }

              const active = isNavItemActive(pathname, item.href, item.exact)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function DashboardNav({
  canList,
  canRequire,
  showOffers,
  unreadNotificationCount,
  userId,
  onNavigate,
  className,
}: {
  canList: boolean
  canRequire: boolean
  showOffers: boolean
  unreadNotificationCount: number
  userId: string
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const groups = getDashboardNavGroups({ canList, canRequire, showOffers })

  return (
    <div className={className}>
      <NavGroups
        groups={groups}
        pathname={pathname}
        unreadNotificationCount={unreadNotificationCount}
        userId={userId}
        onNavigate={onNavigate}
      />
    </div>
  )
}
