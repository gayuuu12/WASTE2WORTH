import Link from "next/link"
import type { MatchView } from "@/lib/matching/queries"
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
      ? listing.company?.name ?? "Supplier"
      : requirement.title

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{listing.title}</CardTitle>
          <MatchTierBadge score={match.score} />
        </div>
        <p className="text-sm text-muted-foreground">
          {perspective === "buyer"
            ? `Supplier: ${counterparty}`
            : `Buyer requirement: ${counterparty}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Material:</span> {requirement.material_name}
          </p>
          <p>
            <span className="text-muted-foreground">Available:</span>{" "}
            {formatQuantity(listing.quantity, listing.quantity_unit)}
          </p>
          <p>
            <span className="text-muted-foreground">Required:</span>{" "}
            {formatQuantity(requirement.quantity_needed, requirement.quantity_unit)}
          </p>
          <p>
            <span className="text-muted-foreground">Distance:</span>{" "}
            {match.distance_km != null
              ? `${match.distance_km.toFixed(1)} km straight-line`
              : "Unavailable"}
          </p>
          <p>
            <span className="text-muted-foreground">Asking price:</span>{" "}
            {formatMoney(listing.asking_price, listing.currency)}
          </p>
          <p>
            <span className="text-muted-foreground">Max price:</span>{" "}
            {formatMoney(requirement.max_price, requirement.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.category?.name ? <Badge variant="secondary">{listing.category.name}</Badge> : null}
          {listing.company?.verification_status === "verified" ? (
            <Badge>Verified supplier</Badge>
          ) : (
            <Badge variant="outline">
              {titleCase(listing.company?.verification_status ?? "unverified")}
            </Badge>
          )}
          <Badge variant="outline">Posted {formatDate(listing.created_at)}</Badge>
        </div>

        <MatchScoreBreakdownView breakdown={breakdown} overall={match.score} />
      </CardContent>
      {perspective === "buyer" ? (
        <CardFooter>
          <Link
            href={`/dashboard/listings/view/${listing.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View listing
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  )
}
