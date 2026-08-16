import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { MarketplaceFiltersForm } from "@/components/listings/marketplace-filters"
import { MarketplaceListingCard } from "@/components/listings/marketplace-listing-card"
import { buttonVariants } from "@/components/ui/button"
import { getWasteCategories } from "@/lib/listings/categories"
import { getMarketplaceListings } from "@/lib/listings/queries"
import { marketplaceFiltersSchema } from "@/lib/validations/listings"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const parsedFilters = marketplaceFiltersSchema.safeParse({
    q: typeof rawParams.q === "string" ? rawParams.q : undefined,
    category: typeof rawParams.category === "string" ? rawParams.category : undefined,
    material: typeof rawParams.material === "string" ? rawParams.material : undefined,
    city: typeof rawParams.city === "string" ? rawParams.city : undefined,
    state: typeof rawParams.state === "string" ? rawParams.state : undefined,
    minQuantity:
      typeof rawParams.minQuantity === "string" ? rawParams.minQuantity : undefined,
    maxPrice: typeof rawParams.maxPrice === "string" ? rawParams.maxPrice : undefined,
    recurring:
      rawParams.recurring === "true" || rawParams.recurring === "false"
        ? rawParams.recurring
        : undefined,
    verified: rawParams.verified === "true" ? "true" : undefined,
  })

  const filters = parsedFilters.success ? parsedFilters.data : {}
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)
  const listings = await getMarketplaceListings(supabase, filters)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <BrandLogo />
          </Link>
          <div className="flex gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Browse active industrial waste listings from verified suppliers
          </p>
        </div>

        <MarketplaceFiltersForm categories={categories} filters={filters} />

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No listings available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <MarketplaceListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
