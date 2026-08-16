import Link from "next/link"
import { MyListingCard } from "@/components/listings/my-listing-card"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"
import { getCompanyListings } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function MyListingsPage() {
  const ctx = await requireCompleteProfile()

  if (!canCreateListings(ctx.company)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">My listings</h1>
        <p className="text-muted-foreground">
          Only supplier and dual-role companies can create waste listings.
        </p>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My listings</h1>
          <p className="text-muted-foreground">Manage your company&apos;s waste listings</p>
        </div>
        <Link href="/dashboard/listings/new" className={cn(buttonVariants())}>
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No listings available yet.</p>
          <Link
            href="/dashboard/listings/new"
            className={cn(buttonVariants(), "mt-4 inline-flex")}
          >
            Create your first listing
          </Link>
        </div>
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
