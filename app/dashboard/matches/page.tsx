import { MatchCard } from "@/components/matches/match-card"
import { MatchFiltersForm } from "@/components/matches/match-filters"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import {
  syncMatchesForBuyerCompany,
  syncMatchesForSupplierCompany,
} from "@/lib/matching/engine"
import {
  hasActiveMatchFilters,
  parseMatchFiltersFromSearchParams,
  serializeMatchFilters,
} from "@/lib/matching/filters"
import {
  getBuyerMatches,
  getSupplierMatches,
} from "@/lib/matching/queries"
import { canManageRequirements } from "@/lib/requirements/auth"
import { canCreateListings } from "@/lib/listings/auth"
import { createClient } from "@/lib/supabase/server"
import { Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

function emptyMatchesMessage(filtersActive: boolean) {
  return filtersActive
    ? "No suitable matches found for these filters."
    : "No suitable matches found yet."
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const rawParams = await searchParams
  const filters = parseMatchFiltersFromSearchParams(rawParams)
  const filtersActive = hasActiveMatchFilters(filters)
  const filterKey = serializeMatchFilters(filters)
  const categories = await getWasteCategories(supabase)

  const isBuyer = canManageRequirements(ctx.company)
  const isSupplierRole = canCreateListings(ctx.company)

  if (isBuyer) {
    await syncMatchesForBuyerCompany(supabase, ctx.company.id)
  }
  if (isSupplierRole) {
    await syncMatchesForSupplierCompany(supabase, ctx.company.id)
  }

  const buyerMatches = isBuyer
    ? await getBuyerMatches(supabase, ctx.company.id, filters)
    : []
  const supplierMatches = isSupplierRole
    ? await getSupplierMatches(supabase, ctx.company.id, filters)
    : []

  const emptyMessage = emptyMatchesMessage(filtersActive)
  const scopedLabel = filters.requirementId
    ? "Showing Smart Matches for one requirement."
    : filters.listingId
      ? "Showing Buyer Opportunities for one listing."
      : null

  return (
    <div className="space-y-8">
      <PageHeader
        title={isBuyer && isSupplierRole ? "Matches & Opportunities" : isBuyer ? "Smart Matches" : "Buyer Opportunities"}
        description="Scored matches between listings and buyer requirements. Distance is straight-line, not driving distance."
      />

      {scopedLabel ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {scopedLabel}
        </div>
      ) : null}

      <MatchFiltersForm key={filterKey} categories={categories} filters={filters} />

      {isBuyer ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Matches for your requirements</h2>
          {buyerMatches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description={emptyMessage}
              icon={<Sparkles className="size-5" aria-hidden />}
            />
          ) : (
            <div className="space-y-4">
              {buyerMatches.map((match) => (
                <MatchCard key={match.id} match={match} perspective="buyer" />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {isSupplierRole ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            Buyer opportunities for your listings
          </h2>
          {supplierMatches.length === 0 ? (
            <EmptyState
              title="No opportunities yet"
              description={emptyMessage}
              icon={<Sparkles className="size-5" aria-hidden />}
            />
          ) : (
            <div className="space-y-4">
              {supplierMatches.map((match) => (
                <MatchCard key={`supplier-${match.id}`} match={match} perspective="supplier" />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!isBuyer && !isSupplierRole ? (
        <EmptyState
          title="Matches unavailable"
          description="Matches are available for buyer and supplier company roles."
        />
      ) : null}
    </div>
  )
}
