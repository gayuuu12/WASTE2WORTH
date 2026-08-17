import type { LucideIcon } from "lucide-react"
import {
  ArrowLeftRight,
  Bell,
  Bot,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  Leaf,
  MessageSquare,
  Package,
  Plus,
  Sparkles,
  Store,
  Wand2,
} from "lucide-react"

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

export function getDashboardNavGroups(options: {
  canList: boolean
  canRequire: boolean
  showOffers: boolean
}): DashboardNavGroup[] {
  const { canList, canRequire, showOffers } = options

  const groups: DashboardNavGroup[] = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/marketplace", label: "Marketplace", icon: Store },
        { href: "/dashboard/matches", label: "Matches", icon: Sparkles },
      ],
    },
  ]

  if (canList) {
    groups.push({
      label: "Sell",
      items: [
        { href: "/dashboard/listings", label: "My Listings", icon: Package },
        { href: "/dashboard/listings/new", label: "New Listing", icon: Plus },
      ],
    })
  }

  if (canRequire || showOffers) {
    const buyItems: DashboardNavItem[] = []
    if (canRequire) {
      buyItems.push({
        href: "/dashboard/requirements",
        label: "Requirements",
        icon: ClipboardList,
      })
    }
    if (showOffers) {
      buyItems.push({ href: "/dashboard/offers", label: "Offers", icon: Handshake })
    }
    if (buyItems.length > 0) {
      groups.push({ label: "Buy", items: buyItems })
    }
  }

  groups.push({
    label: "Insights",
    items: [{ href: "/dashboard/impact", label: "Circular Impact", icon: Leaf }],
  })

  groups.push({
    label: "Business",
    items: [
      { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  })

  groups.push({
    label: "AI",
    items: [
      { href: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
      ...(canList
        ? [{ href: "/dashboard/listings/ai-new", label: "AI Smart Listing", icon: Wand2 }]
        : []),
    ],
  })

  return groups
}

export function isNavItemActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href
  }
  if (href === "/dashboard/listings") {
    return (
      pathname.startsWith("/dashboard/listings") &&
      !pathname.startsWith("/dashboard/listings/new") &&
      !pathname.startsWith("/dashboard/listings/ai-new") &&
      !pathname.startsWith("/dashboard/listings/view")
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
