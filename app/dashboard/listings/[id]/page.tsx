import Link from "next/link"
import { ListingDetailView } from "@/components/listings/listing-detail-view"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { requireOwnedListing } from "@/lib/listings/auth"
import { cn } from "@/lib/utils"

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const listing = await requireOwnedListing(id, ctx.company.id)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/listings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        ← Back to listings
      </Link>
      <ListingDetailView listing={listing} mode="owner" />
    </div>
  )
}
