import Image from "next/image"
import Link from "next/link"
import type { WasteListing } from "@/lib/types"
import { formatDate, formatDistanceKm, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { getPrimaryImage } from "@/lib/listings/queries"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MarketplaceListingCard({
  listing,
  matchScore,
  distanceKm,
}: {
  listing: WasteListing
  matchScore?: number
  distanceKm?: number | null
}) {
  const primary = getPrimaryImage(listing)
  const location = [listing.city, listing.state].filter(Boolean).join(", ")

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] bg-muted">
        {primary ? (
          <Image
            src={primary.image_url}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {matchScore != null && matchScore > 0 ? (
          <Badge className="absolute right-2 top-2 shadow-sm">{matchScore}% Match</Badge>
        ) : null}
      </div>

      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {listing.category?.name ? (
            <Badge variant="secondary">{listing.category.name}</Badge>
          ) : null}
          {listing.recurring ? <Badge variant="outline">Recurring</Badge> : null}
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-snug">{listing.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-sm">
        <p className="text-muted-foreground">{listing.material_name}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <p>
            <span className="text-muted-foreground">Available:</span>{" "}
            {formatQuantity(listing.quantity, listing.quantity_unit)}
          </p>
          <p className="font-medium">
            {formatMoney(listing.asking_price, listing.currency)}
          </p>
        </div>
        <p className="text-muted-foreground">
          {location || "Location not specified"}
          {distanceKm != null ? ` · ${formatDistanceKm(distanceKm)}` : null}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-muted-foreground">{listing.company?.name ?? "Supplier"}</span>
          {listing.company?.verification_status === "verified" ? (
            <Badge className="text-xs">Verified</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              {titleCase(listing.company?.verification_status ?? "unverified")}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Posted {formatDate(listing.created_at)}</span>
        <Link
          href={`/dashboard/listings/view/${listing.id}`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          View listing
        </Link>
      </CardFooter>
    </Card>
  )
}
