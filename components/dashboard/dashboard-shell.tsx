import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { SignOutButton } from "@/components/dashboard/sign-out-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/types"
import { canCreateListings } from "@/lib/listings/auth"
import { canManageRequirements } from "@/lib/requirements/auth"
import { canViewOffers } from "@/lib/offers/auth"

export function DashboardShell({
  children,
  company,
}: {
  children: React.ReactNode
  company: Company
}) {
  const canList = canCreateListings(company)
  const canRequire = canManageRequirements(company)
  const showOffers = canViewOffers(company)

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    ...(canList ? [{ href: "/dashboard/listings", label: "My listings" }] : []),
    ...(canRequire ? [{ href: "/dashboard/requirements", label: "My requirements" }] : []),
    { href: "/dashboard/matches", label: "Matches" },
    ...(showOffers ? [{ href: "/dashboard/offers", label: "Offers" }] : []),
    { href: "/dashboard/transactions", label: "Transactions" },
    { href: "/marketplace", label: "Marketplace" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo />
          <div className="flex flex-wrap items-center gap-2">
            {canList ? (
              <Link href="/dashboard/listings/new" className={cn(buttonVariants({ size: "sm" }))}>
                New listing
              </Link>
            ) : null}
            {canRequire ? (
              <Link
                href="/dashboard/requirements/new"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                New requirement
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
