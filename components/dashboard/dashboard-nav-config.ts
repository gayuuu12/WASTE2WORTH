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
      items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true }],
    },
  ]

  if (canRequire || showOffers) {
    const buyItems: DashboardNavItem[] = []
    if (canRequire) {
      buyItems.push(
        { href: "/marketplace", label: "Marketplace", icon: Store },
        { href: "/dashboard/requirements", label: "My Requirements", icon: ClipboardList },
      )
    }
    if (showOffers) {
      buyItems.push({ href: "/dashboard/offers", label: "My Offers", icon: Handshake })
    }
    if (buyItems.length > 0) {
      groups.push({ label: "Buy", items: buyItems })
    }
  }

  if (canList) {
    groups.push({
      label: "Sell",
      items: [
        { href: "/dashboard/listings", label: "My Listings", icon: Package },
        { href: "/dashboard/listings/ai-new", label: "AI Smart Listing", icon: Wand2 },
        ...(showOffers
          ? [{ href: "/dashboard/offers", label: "Incoming Offers", icon: Handshake }]
          : []),
      ],
    })
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
  if (href === "/dashboard/requirements") {
    return (
      pathname.startsWith("/dashboard/requirements") &&
      !pathname.startsWith("/dashboard/requirements/new")
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
