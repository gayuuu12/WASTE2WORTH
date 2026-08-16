import Link from "next/link"
import type { Offer } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function OfferCard({
  offer,
  perspective,
}: {
  offer: Offer
  perspective: "buyer" | "supplier"
}) {
  const counterparty =
    perspective === "supplier"
      ? (offer.buyer?.name ?? "Buyer")
      : (offer.supplier?.name ?? "Supplier")

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">
            {offer.listing?.title ?? "Listing"}
          </CardTitle>
          <OfferStatusBadge status={offer.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {perspective === "supplier"
            ? `From: ${counterparty}`
            : `To: ${counterparty}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {offer.listing?.material_name ? (
          <p>
            <span className="text-muted-foreground">Material:</span>{" "}
            {offer.listing.material_name}
          </p>
        ) : null}
        <p>
          <span className="text-muted-foreground">Offered quantity:</span>{" "}
          {formatQuantity(offer.quantity, offer.quantity_unit)}
        </p>
        <p>
          <span className="text-muted-foreground">Offered price:</span>{" "}
          {formatMoney(offer.offered_price, offer.currency)}
        </p>
        {offer.message ? (
          <p className="line-clamp-2">
            <span className="text-muted-foreground">Message:</span> {offer.message}
          </p>
        ) : null}
        <p className="text-muted-foreground">Sent {formatDate(offer.created_at)}</p>
      </CardContent>
      <CardFooter>
        <Link
          href={`/dashboard/offers/${offer.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View offer
        </Link>
      </CardFooter>
    </Card>
  )
}
