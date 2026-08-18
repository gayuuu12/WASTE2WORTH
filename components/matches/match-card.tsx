import Link from "next/link"
import type { MatchView } from "@/lib/matching/queries"
import { matchesPageHref } from "@/lib/matching/filters"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import {
  MatchScoreBreakdownView,
  MatchTierBadge,
} from "@/components/matches/match-score-breakdown"
import type { MatchScoreBreakdown } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MatchCard({
  match,
  perspective,
}: {
  match: MatchView
  perspective: "buyer" | "supplier"
}) {
  const listing = match.listing
  const requirement = match.requirement
  const breakdown = (match.score_breakdown ?? null) as MatchScoreBreakdown | null

  const counterparty =
    perspective === "buyer"
      ? (listing.company?.name ?? "Supplier")
      : requirement.title

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-3 border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg leading-snug">{listing.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {perspective === "buyer"
                ? `Supplier: ${counterparty}`
                : `Buyer requirement: ${counterparty}`}
            </p>
          </div>
          <MatchTierBadge score={match.score} />
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.category?.name ? (
            <Badge variant="secondary">{listing.category.name}</Badge>
          ) : null}
          {listing.company?.verification_status === "verified" ? (
            <Badge>Verified supplier</Badge>
          ) : (
            <Badge variant="outline">
              {titleCase(listing.company?.verification_status ?? "unverified")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buyer requirement
            </h3>
            <p className="font-medium">{requirement.material_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Required: {formatQuantity(requirement.quantity_needed, requirement.quantity_unit)}
            </p>
            <p className="text-sm text-muted-foreground">
              Max price: {formatMoney(requirement.max_price, requirement.currency)}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Supplier listing
            </h3>
            <p className="font-medium">{listing.material_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Available: {formatQuantity(listing.quantity, listing.quantity_unit)}
            </p>
            <p className="text-sm text-muted-foreground">
              Asking price: {formatMoney(listing.asking_price, listing.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              Location:{" "}
              {[listing.city, listing.state].filter(Boolean).join(", ") || "Not specified"}
            </p>
            <p className="text-sm text-muted-foreground">
              Distance:{" "}
              {match.distance_km != null
                ? `${match.distance_km.toFixed(1)} km straight-line`
                : "Unavailable"}
            </p>
          </div>
        </div>

        <MatchScoreBreakdownView breakdown={breakdown} overall={match.score} compact />
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t border-border bg-muted/10">
        {perspective === "buyer" ? (
          <>
            <Link
              href={`/dashboard/requirements/${requirement.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View requirement
            </Link>
            <Link
              href={`/dashboard/listings/view/${listing.id}`}
              className={cn(buttonVariants())}
            >
              View listing
            </Link>
            <Link
              href={`/dashboard/listings/view/${listing.id}/offer`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Make offer
            </Link>
          </>
        ) : (
          <Link
            href={matchesPageHref({ listingId: listing.id })}
            className={cn(buttonVariants())}
          >
            View opportunity
          </Link>
        )}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          Posted {formatDate(listing.created_at)}
        </span>
      </CardFooter>
    </Card>
  )
}
