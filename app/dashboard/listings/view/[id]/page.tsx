import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ListingDetailView } from "@/components/listings/listing-detail-view"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { getOwnedListing } from "@/lib/listings/auth"
import { getPublicListing } from "@/lib/listings/queries"
import { canMakeOfferOnListing } from "@/lib/offers/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function BuyerListingViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const ownedListing = await getOwnedListing(id, ctx.company.id)
  if (ownedListing) {
    redirect(`/dashboard/listings/${id}`)
  }

  const listing = await getPublicListing(supabase, id)
  if (!listing) {
    notFound()
  }

  const canMakeOffer = canMakeOfferOnListing(ctx.company, listing)

  return (
    <div className="space-y-6">
      <Link
        href="/marketplace"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to Marketplace
      </Link>
      <ListingDetailView listing={listing} mode="buyer" canMakeOffer={canMakeOffer} />
    </div>
  )
}
