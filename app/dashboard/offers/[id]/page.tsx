import Link from "next/link"
import { notFound } from "next/navigation"
import { OfferDetailView } from "@/components/offers/offer-detail-view"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import {
  getCounterOffersForParent,
  getOfferForParticipant,
} from "@/lib/offers/queries"
import { getTransactionForOffer } from "@/lib/transactions/queries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const rawParams = await searchParams
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const offer = await getOfferForParticipant(supabase, id, ctx.company.id)
  if (!offer) {
    notFound()
  }

  const viewerRole =
    offer.buyer_company_id === ctx.company.id ? "buyer" : "supplier"

  const counterOffers = offer.is_counter
    ? []
    : await getCounterOffersForParent(supabase, offer.id)

  const transaction = await getTransactionForOffer(supabase, offer.id)
  const counterTransaction =
    !transaction && counterOffers[0]
      ? await getTransactionForOffer(supabase, counterOffers[0].id)
      : null

  const justCreated = rawParams.created === "1"
  const justRejected = rawParams.rejected === "1"
  const justCountered = rawParams.countered === "1"

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/offers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to offers
      </Link>

      {justCreated ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Your offer was submitted successfully. The supplier can review it from their
          dashboard.
        </div>
      ) : null}

      {justRejected ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          The offer was rejected.
        </div>
      ) : null}

      {justCountered ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          Counteroffer submitted. The buyer can review it from their dashboard.
        </div>
      ) : null}

      <OfferDetailView
        offer={offer}
        viewerRole={viewerRole}
        counterOffers={counterOffers}
        transactionId={transaction?.id ?? counterTransaction?.id ?? null}
      />

      {offer.listing?.id ? (
        <Link
          href={`/dashboard/listings/view/${offer.listing.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View listing
        </Link>
      ) : null}
    </div>
  )
}
