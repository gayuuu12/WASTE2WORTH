import Image from "next/image"
import Link from "next/link"
import type { WasteListing } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { ListingStatusBadge } from "@/components/listings/listing-status-badge"
import { ListingRowActions } from "@/components/listings/listing-row-actions"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ListingDetailView({
  listing,
  mode,
  canMakeOffer = false,
}: {
  listing: WasteListing
  mode: "owner" | "buyer" | "public"
  canMakeOffer?: boolean
}) {
  const location = [listing.city, listing.state, listing.country].filter(Boolean).join(", ")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">{listing.title}</h1>
            {mode !== "public" ? <ListingStatusBadge status={listing.status} /> : null}
          </div>
          {listing.category?.name ? (
            <Badge variant="secondary">{listing.category.name}</Badge>
          ) : null}
        </div>

        {mode === "owner" ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/listings/${listing.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit
            </Link>
            <ListingRowActions listingId={listing.id} status={listing.status} />
          </div>
        ) : canMakeOffer ? (
          <Link
            href={`/dashboard/listings/view/${listing.id}/offer`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Make offer
          </Link>
        ) : null}
      </div>

      {listing.images && listing.images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {listing.images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image
                src={image.image_url}
                alt={listing.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Material:</span> {listing.material_name}</p>
            {listing.material_grade ? (
              <p><span className="text-muted-foreground">Grade:</span> {listing.material_grade}</p>
            ) : null}
            <p><span className="text-muted-foreground">Quantity:</span> {formatQuantity(listing.quantity, listing.quantity_unit)}</p>
            {listing.minimum_order_quantity ? (
              <p><span className="text-muted-foreground">MOQ:</span> {formatQuantity(listing.minimum_order_quantity, listing.quantity_unit)}</p>
            ) : null}
            {listing.condition ? (
              <p><span className="text-muted-foreground">Condition:</span> {titleCase(listing.condition)}</p>
            ) : null}
            {listing.contamination_level ? (
              <p><span className="text-muted-foreground">Contamination:</span> {titleCase(listing.contamination_level)}</p>
            ) : null}
            {listing.moisture_level ? (
              <p><span className="text-muted-foreground">Moisture:</span> {titleCase(listing.moisture_level)}</p>
            ) : null}
            {listing.quality_notes ? (
              <p><span className="text-muted-foreground">Quality notes:</span> {listing.quality_notes}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Price:</span> {formatMoney(listing.asking_price, listing.currency)}</p>
            {listing.price_unit ? (
              <p><span className="text-muted-foreground">Price unit:</span> {titleCase(listing.price_unit)}</p>
            ) : null}
            <p><span className="text-muted-foreground">Negotiable:</span> {listing.negotiable ? "Yes" : "No"}</p>
            <p><span className="text-muted-foreground">Recurring:</span> {listing.recurring ? "Yes" : "No"}</p>
            {listing.availability_frequency ? (
              <p><span className="text-muted-foreground">Frequency:</span> {titleCase(listing.availability_frequency)}</p>
            ) : null}
            {listing.available_from ? (
              <p><span className="text-muted-foreground">Available from:</span> {formatDate(listing.available_from)}</p>
            ) : null}
            <p><span className="text-muted-foreground">Location:</span> {location || "—"}</p>
            <p><span className="text-muted-foreground">Posted:</span> {formatDate(listing.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      {listing.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </CardContent>
        </Card>
      ) : null}

      {listing.company ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{listing.company.name}</p>
            <Badge variant={listing.company.verification_status === "verified" ? "default" : "outline"}>
              {titleCase(listing.company.verification_status)}
            </Badge>
            <p className="text-muted-foreground">
              {[listing.company.city, listing.company.state, listing.company.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
