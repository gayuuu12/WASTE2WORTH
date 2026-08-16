import Image from "next/image"
import type { WasteListing } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { getPrimaryImage } from "@/lib/listings/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function MarketplaceListingCard({ listing }: { listing: WasteListing }) {
  const primary = getPrimaryImage(listing)
  const location = [listing.city, listing.state].filter(Boolean).join(", ")

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] bg-muted">
        {primary ? (
          <Image
            src={primary.image_url}
            alt={listing.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {listing.category?.name ? (
            <Badge variant="secondary">{listing.category.name}</Badge>
          ) : null}
          {listing.recurring ? <Badge variant="outline">Recurring</Badge> : null}
        </div>
        <CardTitle className="text-lg">{listing.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{listing.material_name}</p>
        <p>{formatQuantity(listing.quantity, listing.quantity_unit)}</p>
        <p className="font-medium">{formatMoney(listing.asking_price, listing.currency)}</p>
        <p className="text-muted-foreground">{location || "Location not specified"}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-muted-foreground">{listing.company?.name ?? "Supplier"}</span>
          {listing.company?.verification_status === "verified" ? (
            <Badge>Verified</Badge>
          ) : (
            <Badge variant="outline">{titleCase(listing.company?.verification_status ?? "unverified")}</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Posted {formatDate(listing.created_at)}
      </CardFooter>
    </Card>
  )
}
