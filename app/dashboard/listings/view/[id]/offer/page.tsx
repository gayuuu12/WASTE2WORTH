import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { OfferForm } from "@/components/offers/offer-form"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { getOwnedListing } from "@/lib/listings/auth"
import { getPublicListing } from "@/lib/listings/queries"
import { canMakeOfferOnListing } from "@/lib/offers/auth"
import { requireBuyerContext } from "@/lib/requirements/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function MakeOfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireCompleteProfile()
  const ctx = await requireBuyerContext()
  const supabase = await createClient()

  const ownedListing = await getOwnedListing(id, ctx.company.id)
  if (ownedListing) {
    redirect(`/dashboard/listings/${id}`)
  }

  const listing = await getPublicListing(supabase, id)
  if (!listing) {
    notFound()
  }

  if (!canMakeOfferOnListing(ctx.company, listing)) {
    redirect(`/dashboard/listings/view/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/listings/view/${id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to listing
      </Link>

      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Make offer</h1>
        <p className="text-muted-foreground">
          Submit a binding offer to the supplier. They will review it from their dashboard.
        </p>
      </div>

      <OfferForm listing={listing} />
    </div>
  )
}
