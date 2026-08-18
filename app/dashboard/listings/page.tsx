import Link from "next/link"
import { MyListingCard } from "@/components/listings/my-listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"
import { getCompanyListings } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Package, Plus, Wand2 } from "lucide-react"

export default async function MyListingsPage() {
  const ctx = await requireCompleteProfile()

  if (!canCreateListings(ctx.company)) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="My listings"
          description="Only supplier and dual-role companies can create waste listings."
        />
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to dashboard
        </Link>
      </div>
    )
  }

  const supabase = await createClient()
  const listings = await getCompanyListings(supabase, ctx.company.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Listings"
        description="Manage your materials — matching buyers appear on each active listing."
      >
        <Link href="/dashboard/listings/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 size-4" aria-hidden />
          New listing
        </Link>
      </PageHeader>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Publish your first surplus material and start finding buyers."
          icon={<Package className="size-5" aria-hidden />}
        >
          <Link href="/dashboard/listings/new" className={cn(buttonVariants())}>
            Create listing
          </Link>
          <Link
            href="/dashboard/listings/ai-new"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Wand2 className="mr-2 size-4" aria-hidden />
            Try AI Smart Listing
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
