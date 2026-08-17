import { OfferCard } from "@/components/offers/offer-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"
import { getIncomingOffers, getSentOffers } from "@/lib/offers/queries"
import { canManageRequirements } from "@/lib/requirements/auth"
import { createClient } from "@/lib/supabase/server"
import { Handshake } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OffersPage() {
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()

  const isBuyer = canManageRequirements(ctx.company)
  const isSupplier = canCreateListings(ctx.company)

  const incomingOffers = isSupplier
    ? await getIncomingOffers(supabase, ctx.company.id)
    : []
  const sentOffers = isBuyer ? await getSentOffers(supabase, ctx.company.id) : []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Offers"
        description="Review incoming offers on your listings or track offers you have sent to suppliers."
      />

      {isSupplier ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Incoming offers</h2>
          {incomingOffers.length === 0 ? (
            <EmptyState
              title="No offers yet"
              description="Offers from buyers will appear here when they respond to your listings."
              icon={<Handshake className="size-5" aria-hidden />}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {incomingOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} perspective="supplier" />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {isBuyer ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Sent offers</h2>
          {sentOffers.length === 0 ? (
            <EmptyState
              title="No sent offers"
              description="Browse matches to find listings and submit your first offer."
              icon={<Handshake className="size-5" aria-hidden />}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sentOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} perspective="buyer" />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!isBuyer && !isSupplier ? (
        <EmptyState
          title="Offers unavailable"
          description="Offers are available for buyer and supplier company roles."
        />
      ) : null}
    </div>
  )
}
