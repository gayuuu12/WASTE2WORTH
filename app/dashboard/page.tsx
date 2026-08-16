import Link from "next/link"
import { MyListingCard } from "@/components/listings/my-listing-card"
import { MatchCard } from "@/components/matches/match-card"
import { RequirementCard } from "@/components/requirements/requirement-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
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
import { titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { BuyerRequirement, WasteListing } from "@/lib/types"
import type { MatchView } from "@/lib/matching/queries"

export default async function DashboardPage() {
  const ctx = await requireCompleteProfile()
  const { profile, company, user } = ctx
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

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">Your Waste2Worth business dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Your account</CardDescription>
            <CardTitle className="text-xl">{profile.full_name ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {profile.email ?? user.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {profile.phone ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Company</CardDescription>
            <CardTitle className="text-xl">{company.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{titleCase(company.role)}</Badge>
              <Badge variant="outline">{titleCase(company.verification_status)}</Badge>
            </div>
            <p>
              <span className="text-muted-foreground">Industry:</span>{" "}
              {company.industry ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Business type:</span>{" "}
              {company.business_type ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {isBuyer ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold tabular">{activeRequirementCount}</p>
              <Link
                href="/dashboard/requirements"
                className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
              >
                Manage requirements
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Top matches</CardTitle>
              <CardDescription>Highest-scoring listings for your requirements</CardDescription>
            </CardHeader>
            <CardContent>
              {topBuyerMatches.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No suitable matches found yet.</p>
                  <Link href="/dashboard/requirements/new" className={cn(buttonVariants({ size: "sm" }))}>
                    Create requirement
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {topBuyerMatches.map((match) => (
                    <MatchCard key={match.id} match={match} perspective="buyer" />
                  ))}
                  <Link href="/dashboard/matches" className="text-sm text-primary underline-offset-4 hover:underline">
                    View all matches
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

      {isSupplier ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold tabular">{activeListingCount}</p>
              <Link
                href="/dashboard/listings"
                className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
              >
                Manage listings
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buyer opportunities</CardTitle>
              <CardDescription>Good or excellent matches (70%+)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold tabular">{supplierOpportunities}</p>
              <Link
                href="/dashboard/matches"
                className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
              >
                View matches
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recent listings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentListings.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No listings available yet.</p>
                  <Link href="/dashboard/listings/new" className={cn(buttonVariants({ size: "sm" }))}>
                    Create listing
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentListings.map((listing) => (
                    <MyListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isSupplier && topSupplierMatches.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matching buyer opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSupplierMatches.map((match) => (
              <MatchCard key={`supplier-${match.id}`} match={match} perspective="supplier" />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet. Activity will appear here once trading begins.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-2xl font-display font-bold tabular">{transactionCount}</p>
              <Link
                href="/dashboard/transactions"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                View transactions
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
