import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPostAuthRedirect, getSessionContext } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const ctx = await getSessionContext()

  if (ctx) {
    redirect(getPostAuthRedirect(ctx.profile, ctx.company))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign in
            </Link>
            <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Marketplace
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium text-primary">B2B circular economy marketplace</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Turn industrial waste into worth
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Waste2Worth connects suppliers with surplus byproducts to buyers who
            need feedstock. Register your company, list materials, and track real
            environmental impact — no landfill required.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Create company account
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
