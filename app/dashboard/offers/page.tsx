import { OfferCard } from "@/components/offers/offer-card"
import { requireCompleteProfile } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"
import { getIncomingOffers, getSentOffers } from "@/lib/offers/queries"
import { canManageRequirements } from "@/lib/requirements/auth"
import { createClient } from "@/lib/supabase/server"

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
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">
          Review incoming offers on your listings or track offers you have sent to suppliers.
        </p>
      </div>

      {isSupplier ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Incoming offers</h2>
          {incomingOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">No incoming offers yet.</p>
            </div>
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
          <h2 className="font-display text-xl font-semibold">My sent offers</h2>
          {sentOffers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">
                You have not sent any offers yet. Browse matches to find listings.
              </p>
            </div>
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
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            Offers are available for buyer and supplier company roles.
          </p>
        </div>
      ) : null}
    </div>
  )
}
