import Link from "next/link"
import { ListingDetailView } from "@/components/listings/listing-detail-view"
import { EmbeddedMatchesSection } from "@/components/matches/embedded-matches-section"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { generateMatchesForListing } from "@/lib/matching/engine"
import { getMatchesForListing } from "@/lib/matching/queries"
import { requireOwnedListing } from "@/lib/listings/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const listing = await requireOwnedListing(id, ctx.company.id)

  if (listing.status === "active") {
    await generateMatchesForListing(supabase, listing.id)
  }

  const matches = await getMatchesForListing(supabase, listing.id, ctx.company.id)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/listings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        ← Back to My Listings
      </Link>
      <ListingDetailView listing={listing} mode="owner" />

      {listing.status === "active" ? (
        <EmbeddedMatchesSection
          title="Matching Buyers"
          matches={matches}
          perspective="supplier"
          emptyMessage="No matching buyers yet. New buyer requirements are checked automatically when you open this listing."
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Activate this listing to see matching buyer requirements.
        </p>
      )}
    </div>
  )
}
