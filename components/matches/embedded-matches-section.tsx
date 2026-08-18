import Link from "next/link"
import type { MatchView } from "@/lib/matching/queries"
import { MatchTierBadge } from "@/components/matches/match-score-breakdown"
import { formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function BuyerSupplierMatchRow({ match }: { match: MatchView }) {
  const listing = match.listing

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-display font-semibold">{listing.title}</p>
            <p className="text-sm text-muted-foreground">
              Supplier: {listing.company?.name ?? "Supplier"}
            </p>
          </div>
          <MatchTierBadge score={match.score} />
        </div>
        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="text-foreground">{listing.material_name}</span>
          </p>
          <p>Available: {formatQuantity(listing.quantity, listing.quantity_unit)}</p>
          <p>Asking: {formatMoney(listing.asking_price, listing.currency)}</p>
          {match.distance_km != null ? (
            <p>{match.distance_km.toFixed(1)} km away</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/listings/view/${listing.id}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            View Listing
          </Link>
          <Link
            href={`/dashboard/listings/view/${listing.id}/offer`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Make Offer
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SupplierBuyerMatchRow({ match }: { match: MatchView }) {
  const requirement = match.requirement
  const location = [requirement.preferred_city, requirement.preferred_state]
    .filter(Boolean)
    .join(", ")

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buyer requirement
            </p>
            <p className="font-display font-semibold">{requirement.title}</p>
            <p className="text-sm text-muted-foreground">{requirement.material_name}</p>
          </div>
          <MatchTierBadge score={match.score} />
        </div>
        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            Required: {formatQuantity(requirement.quantity_needed, requirement.quantity_unit)}
          </p>
          <p>Maximum: {formatMoney(requirement.max_price, requirement.currency)}</p>
          {location ? <p>Location: {location}</p> : null}
          {requirement.preferred_quality ? (
            <p>Quality: {titleCase(requirement.preferred_quality)}</p>
          ) : null}
        </div>
        <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">View Requirement</summary>
          <div className="mt-3 space-y-1 text-muted-foreground">
            {requirement.desired_grade ? <p>Grade: {requirement.desired_grade}</p> : null}
            {requirement.minimum_acceptable_quantity ? (
              <p>
                Minimum acceptable:{" "}
                {formatQuantity(
                  requirement.minimum_acceptable_quantity,
                  requirement.quantity_unit,
                )}
              </p>
            ) : null}
            {requirement.max_distance_km ? (
              <p>Max distance: {requirement.max_distance_km} km</p>
            ) : null}
            {requirement.description ? (
              <p className="whitespace-pre-wrap pt-1">{requirement.description}</p>
            ) : null}
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export function EmbeddedMatchesSection({
  title,
  matches,
  perspective,
  emptyMessage,
}: {
  title: string
  matches: MatchView[]
  perspective: "buyer" | "supplier"
  emptyMessage: string
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>

      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) =>
            perspective === "buyer" ? (
              <BuyerSupplierMatchRow key={match.id} match={match} />
            ) : (
              <SupplierBuyerMatchRow key={`supplier-${match.id}`} match={match} />
            ),
          )}
        </div>
      )}
    </section>
  )
}
