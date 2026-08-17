import Link from "next/link"
import { MyListingCard } from "@/components/listings/my-listing-card"
import { MatchCard } from "@/components/matches/match-card"
import { RequirementCard } from "@/components/requirements/requirement-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireCompleteProfile } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"
import {
  getActiveListingCount,
  getRecentCompanyListings,
} from "@/lib/listings/queries"
import {
  getActiveRequirementCount,
  getSupplierMatchOpportunityCount,
  getTopMatchesForBuyer,
  getTopMatchesForSupplier,
} from "@/lib/matching/queries"
import { canManageRequirements } from "@/lib/requirements/auth"
import { getCompanyRequirements } from "@/lib/requirements/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { BuyerRequirement, WasteListing } from "@/lib/types"
import type { MatchView } from "@/lib/matching/queries"
import {
  ArrowLeftRight,
  ClipboardList,
  Package,
  Plus,
  Sparkles,
  Store,
  Wand2,
} from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const ctx = await requireCompleteProfile()
  const { profile, company } = ctx
  const supabase = await createClient()
  const isSupplier = canCreateListings(company)
  const isBuyer = canManageRequirements(company)

  let activeListingCount = 0
  let recentListings: WasteListing[] = []
  let activeRequirementCount = 0
  let recentRequirements: BuyerRequirement[] = []
  let topBuyerMatches: MatchView[] = []
  let supplierOpportunities = 0
  let topSupplierMatches: MatchView[] = []
  let transactionCount = 0

  if (isSupplier) {
    activeListingCount = await getActiveListingCount(supabase, company.id)
    recentListings = await getRecentCompanyListings(supabase, company.id, 3)
    supplierOpportunities = await getSupplierMatchOpportunityCount(supabase, company.id)
    topSupplierMatches = await getTopMatchesForSupplier(supabase, company.id, 3)
  }

  if (isBuyer) {
    activeRequirementCount = await getActiveRequirementCount(supabase, company.id)
    const requirements = await getCompanyRequirements(company.id)
    recentRequirements = requirements.slice(0, 3)
    topBuyerMatches = await getTopMatchesForBuyer(supabase, company.id, 3)
  }

  const { count: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .or(`buyer_company_id.eq.${company.id},supplier_company_id.eq.${company.id}`)

  if (!transactionsError) {
    transactionCount = transactions ?? 0
  }

  const firstName = profile.full_name?.split(" ")[0]
  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
        description="Here's what's happening with your marketplace activity."
      />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Activity summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isSupplier ? (
            <>
              <StatCard
                label="Active listings"
                value={activeListingCount}
                href="/dashboard/listings"
                hrefLabel="Manage listings"
              />
              <StatCard
                label="Buyer opportunities"
                description="Matches at 70% or higher"
                value={supplierOpportunities}
                href="/dashboard/matches"
                hrefLabel="View matches"
              />
            </>
          ) : null}
          {isBuyer ? (
            <>
              <StatCard
                label="Active requirements"
                value={activeRequirementCount}
                href="/dashboard/requirements"
                hrefLabel="Manage requirements"
              />
              <StatCard
                label="Matching listings"
                value={topBuyerMatches.length > 0 ? topBuyerMatches.length : "—"}
                href="/dashboard/matches"
                hrefLabel="View matches"
              />
            </>
          ) : null}
          <StatCard
            label="Active transactions"
            value={transactionCount}
            href="/dashboard/transactions"
            hrefLabel="View transactions"
            className={!isSupplier && !isBuyer ? "sm:col-span-2" : undefined}
          />
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading" className="space-y-4">
        <h2 id="quick-actions-heading" className="font-display text-lg font-semibold">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {isSupplier ? (
            <>
              <Link href="/dashboard/listings/new" className={cn(buttonVariants())}>
                <Plus className="mr-2 size-4" aria-hidden />
                Create listing
              </Link>
              <Link
                href="/dashboard/listings/ai-new"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <Wand2 className="mr-2 size-4" aria-hidden />
                AI Smart Listing
              </Link>
            </>
          ) : null}
          {isBuyer ? (
            <>
              <Link href="/dashboard/requirements/new" className={cn(buttonVariants())}>
                <Plus className="mr-2 size-4" aria-hidden />
                Add requirement
              </Link>
              <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline" }))}>
                <Store className="mr-2 size-4" aria-hidden />
                Browse marketplace
              </Link>
            </>
          ) : null}
          <Link href="/dashboard/matches" className={cn(buttonVariants({ variant: "outline" }))}>
            <Sparkles className="mr-2 size-4" aria-hidden />
            View matches
          </Link>
        </div>
      </section>

      <section aria-labelledby="recent-activity-heading" className="space-y-4">
        <h2 id="recent-activity-heading" className="font-display text-lg font-semibold">
          Recent activity
        </h2>

        {isSupplier && recentListings.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentListings.map((listing) => (
                <MyListingCard key={listing.id} listing={listing} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {isBuyer && recentRequirements.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRequirements.map((requirement) => (
                <RequirementCard key={requirement.id} requirement={requirement} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {isBuyer && topBuyerMatches.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Top matches for your requirements</p>
            {topBuyerMatches.map((match) => (
              <MatchCard key={match.id} match={match} perspective="buyer" />
            ))}
          </div>
        ) : null}

        {isSupplier && topSupplierMatches.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Matching buyer opportunities</p>
            {topSupplierMatches.map((match) => (
              <MatchCard key={`supplier-${match.id}`} match={match} perspective="supplier" />
            ))}
          </div>
        ) : null}

        {isSupplier &&
        recentListings.length === 0 &&
        topSupplierMatches.length === 0 &&
        !isBuyer ? (
          <EmptyState
            title="No listings yet"
            description="Publish your first surplus material and start finding buyers."
            icon={<Package className="size-5" aria-hidden />}
          >
            <Link href="/dashboard/listings/new" className={cn(buttonVariants())}>
              Create listing
            </Link>
            <Link
              href="/dashboard/listings/ai-new"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Try AI Smart Listing
            </Link>
          </EmptyState>
        ) : null}

        {isBuyer &&
        recentRequirements.length === 0 &&
        topBuyerMatches.length === 0 &&
        !isSupplier ? (
          <EmptyState
            title="No requirements yet"
            description="Tell Waste2Worth what material you need."
            icon={<ClipboardList className="size-5" aria-hidden />}
          >
            <Link href="/dashboard/requirements/new" className={cn(buttonVariants())}>
              Add requirement
            </Link>
          </EmptyState>
        ) : null}

        {transactionCount > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transactions</CardTitle>
              <Link
                href="/dashboard/transactions"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-2 text-2xl font-display font-bold tabular">
                <ArrowLeftRight className="size-5 text-muted-foreground" aria-hidden />
                {transactionCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Active deals across {company.name}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  )
}
