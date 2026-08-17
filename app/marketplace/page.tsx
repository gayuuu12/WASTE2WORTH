import Link from "next/link"
import { MarketplaceFiltersForm } from "@/components/listings/marketplace-filters"
import { MarketplaceListingCard } from "@/components/listings/marketplace-listing-card"
import { BrandLogo } from "@/components/brand-logo"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { getSessionContext } from "@/lib/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import {
  getMarketplaceListings,
  marketplaceResultsAreEmpty,
} from "@/lib/listings/queries"
import { marketplaceFiltersSchema } from "@/lib/validations/listings"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Store } from "lucide-react"

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
  const session = await getSessionContext()
  const categories = await getWasteCategories(supabase)
  const results = await getMarketplaceListings(supabase, filters, {
    buyerLatitude: session?.company?.latitude ?? null,
    buyerLongitude: session?.company?.longitude ?? null,
  })
  const isEmpty = marketplaceResultsAreEmpty(results)

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

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title="Marketplace"
          description="Browse active industrial waste listings from verified suppliers."
        />

        <MarketplaceFiltersForm categories={categories} filters={filters} />

        {isEmpty ? (
          <EmptyState
            title="No listings available"
            description="Check back soon or adjust your filters to see more materials."
            icon={<Store className="size-5" aria-hidden />}
          />
        ) : (
          <div className="space-y-10">
            {results.strong.length > 0 ? (
              <section className="space-y-4">
                {results.hasActiveFilters ? (
                  <h2 className="text-lg font-semibold tracking-tight">Top recommendations</h2>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.strong.map(({ listing, score, distanceKm }) => (
                    <MarketplaceListingCard
                      key={listing.id}
                      listing={listing}
                      matchScore={results.hasActiveFilters ? score : undefined}
                      distanceKm={distanceKm}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {results.alternatives.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Recommended alternatives</h2>
                  <p className="text-sm text-muted-foreground">
                    Partial matches ranked by relevance and distance.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.alternatives.map(({ listing, score, distanceKm }) => (
                    <MarketplaceListingCard
                      key={listing.id}
                      listing={listing}
                      matchScore={score}
                      distanceKm={distanceKm}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
