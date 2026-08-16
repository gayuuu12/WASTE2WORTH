import Link from "next/link"
import Image from "next/image"
import type { WasteListing } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { getPrimaryImage } from "@/lib/listings/queries"
import { ListingStatusBadge } from "@/components/listings/listing-status-badge"
import { ListingRowActions } from "@/components/listings/listing-row-actions"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MyListingCard({ listing }: { listing: WasteListing }) {
  const primary = getPrimaryImage(listing)

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr_auto]">
        <div className="relative aspect-[4/3] bg-muted sm:aspect-auto sm:min-h-[120px]">
          {primary ? (
            <Image
              src={primary.image_url}
              alt={listing.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <CardContent className="space-y-2 py-4 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-semibold">{listing.title}</h3>
            <ListingStatusBadge status={listing.status} />
          </div>
          <p className="text-sm text-muted-foreground">{listing.material_name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{formatQuantity(listing.quantity, listing.quantity_unit)}</span>
            <span>{formatMoney(listing.asking_price, listing.currency)}</span>
            <span className="text-muted-foreground">{formatDate(listing.created_at)}</span>
          </div>
          {listing.category?.name ? (
            <p className="text-xs text-muted-foreground">{listing.category.name}</p>
          ) : null}
        </CardContent>

        <div className="flex flex-row flex-wrap items-start gap-2 border-t border-border p-4 sm:flex-col sm:border-t-0 sm:border-l">
          <Link
            href={`/dashboard/listings/${listing.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View
          </Link>
          <Link
            href={`/dashboard/listings/${listing.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <ListingRowActions listingId={listing.id} status={listing.status} />
        </div>
      </div>
    </Card>
  )
}
