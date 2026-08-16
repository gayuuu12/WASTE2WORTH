import Link from "next/link"
import type { Offer } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { OfferNegotiationActions } from "@/components/offers/offer-negotiation-actions"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function OfferDetailView({
  offer,
  viewerRole,
  counterOffers = [],
  transactionId,
}: {
  offer: Offer
  viewerRole: "buyer" | "supplier"
  counterOffers?: Offer[]
  transactionId?: string | null
}) {
  const counterpartyLabel = viewerRole === "buyer" ? "Supplier" : "Buyer company"
  const offerLabel = offer.is_counter ? "Counteroffer" : "Offer terms"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">Offer details</h1>
          <div className="flex flex-wrap items-center gap-2">
            <OfferStatusBadge status={offer.status} />
            {offer.is_counter ? <Badge variant="outline">Counteroffer</Badge> : null}
          </div>
        </div>
      </div>

      {transactionId ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          This offer was accepted.{" "}
          <Link
            href={`/dashboard/transactions/${transactionId}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            View transaction
          </Link>
        </div>
      ) : null}

      {offer.parent_offer_id ? (
        <p className="text-sm text-muted-foreground">
          Related to{" "}
          <Link
            href={`/dashboard/offers/${offer.parent_offer_id}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            original offer
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{offerLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Quantity:</span>{" "}
              {formatQuantity(offer.quantity, offer.quantity_unit)}
            </p>
            <p>
              <span className="text-muted-foreground">Offered price:</span>{" "}
              {formatMoney(offer.offered_price, offer.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span> {titleCase(offer.status)}
            </p>
            <p>
              <span className="text-muted-foreground">Submitted:</span>{" "}
              {formatDate(offer.created_at)}
            </p>
            {offer.message ? (
              <p className="whitespace-pre-wrap">
                <span className="text-muted-foreground">Message:</span> {offer.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{offer.listing?.title ?? "—"}</p>
            {offer.listing?.material_name ? (
              <p>
                <span className="text-muted-foreground">Material:</span>{" "}
                {offer.listing.material_name}
              </p>
            ) : null}
            {offer.listing ? (
              <p>
                <span className="text-muted-foreground">Available:</span>{" "}
                {formatQuantity(offer.listing.quantity, offer.listing.quantity_unit)}
              </p>
            ) : null}
            {offer.listing?.asking_price != null ? (
              <p>
                <span className="text-muted-foreground">Asking price:</span>{" "}
                {formatMoney(offer.listing.asking_price, offer.listing.currency)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {!offer.is_counter && counterOffers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counteroffers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {counterOffers.map((counter) => (
              <div key={counter.id} className="rounded-md border border-border p-3">
                <p>
                  {formatQuantity(counter.quantity, counter.quantity_unit)} at{" "}
                  {formatMoney(counter.offered_price, counter.currency)} —{" "}
                  {titleCase(counter.status)}
                </p>
                <Link
                  href={`/dashboard/offers/${counter.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  View counteroffer
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{counterpartyLabel}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Company details appear when counterparty RLS policy is applied (migration 000005).
        </CardContent>
      </Card>

      <OfferNegotiationActions
        offer={offer}
        viewerRole={viewerRole}
        counterOffers={counterOffers}
      />
    </div>
  )
}
