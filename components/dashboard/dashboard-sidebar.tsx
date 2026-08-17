"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { SignOutButton } from "@/components/dashboard/sign-out-button"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { titleCase } from "@/lib/format"
import type { Company } from "@/lib/types"

export function DashboardSidebar({
  company,
  canList,
  canRequire,
  showOffers,
  unreadNotificationCount,
  userId,
}: {
  company: Company
  canList: boolean
  canRequire: boolean
  showOffers: boolean
  unreadNotificationCount: number
  userId: string
}) {
  const [open, setOpen] = useState(false)

  const navProps = {
    canList,
    canRequire,
    showOffers,
    unreadNotificationCount,
    userId,
  }

  const companyFooter = (
    <div className="mt-auto border-t border-sidebar-border px-4 py-4">
      <div className="mb-3 min-w-0">
        <p className="truncate text-sm font-medium">{company.name}</p>
        <p className="text-xs text-muted-foreground">{titleCase(company.role)}</p>
      </div>
      <SignOutButton />
    </div>
  )

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/dashboard" className="min-w-0">
          <BrandLogo size="sm" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="icon" className="size-11 shrink-0" />}
          >
            <Menu className="size-5" />
            <span className="sr-only">Open navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0">
            <SheetHeader className="border-b border-border px-4 py-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandLogo size="sm" />
            </SheetHeader>
            <div className="flex h-[calc(100%-4rem)] flex-col overflow-y-auto px-2 py-4">
              <DashboardNav {...navProps} onNavigate={() => setOpen(false)} />
              {companyFooter}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Link href="/dashboard">
            <BrandLogo />
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-4">
          <DashboardNav {...navProps} />
        </div>
        {companyFooter}
      </aside>
    </>
  )
}
