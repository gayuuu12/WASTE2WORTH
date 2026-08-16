"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  acceptOfferAction,
  counterOfferAction,
  rejectOfferAction,
  type NegotiationActionResult,
} from "@/lib/actions/offer-negotiation"
import {
  canBuyerRespondToCounter,
  canSupplierRespondToOffer,
} from "@/lib/offers/negotiation"
import type { Offer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: NegotiationActionResult = {}

export function OfferNegotiationActions({
  offer,
  viewerRole,
  counterOffers,
}: {
  offer: Offer
  viewerRole: "buyer" | "supplier"
  counterOffers: Offer[]
}) {
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptOfferAction,
    initialState,
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectOfferAction,
    initialState,
  )
  const [counterState, counterAction, counterPending] = useActionState(
    counterOfferAction,
    initialState,
  )
  const [showCounterForm, setShowCounterForm] = useState(false)

  const pending = acceptPending || rejectPending || counterPending
  const latestCounter = counterOffers[0]

  useEffect(() => {
    if (acceptState.error) toast.error(acceptState.error)
    if (rejectState.error) toast.error(rejectState.error)
    if (counterState.error) toast.error(counterState.error)
  }, [acceptState.error, rejectState.error, counterState.error])

  const supplierCanRespond =
    viewerRole === "supplier" &&
    !offer.is_counter &&
    canSupplierRespondToOffer(offer, offer.supplier_company_id)

  const buyerCanRespondToCounter =
    viewerRole === "buyer" &&
    (offer.is_counter
      ? canBuyerRespondToCounter(offer, offer.buyer_company_id)
      : latestCounter != null &&
        canBuyerRespondToCounter(latestCounter, offer.buyer_company_id))

  if (!supplierCanRespond && !buyerCanRespondToCounter) {
    return null
  }

  const actionOfferId =
    offer.is_counter && buyerCanRespondToCounter
      ? offer.id
      : latestCounter && buyerCanRespondToCounter
        ? latestCounter.id
        : offer.id

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <h2 className="font-display text-lg font-semibold">Actions</h2>

      {buyerCanRespondToCounter && latestCounter ? (
        <p className="text-sm text-muted-foreground">
          The supplier sent a counteroffer for{" "}
          {latestCounter.quantity} {latestCounter.quantity_unit} at{" "}
          {latestCounter.currency} {latestCounter.offered_price}.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="offerId" value={actionOfferId} />
          <Button type="submit" disabled={pending}>
            {acceptPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {buyerCanRespondToCounter ? "Accept counter" : "Accept offer"}
          </Button>
        </form>

        <form action={rejectAction}>
          <input type="hidden" name="offerId" value={actionOfferId} />
          <Button type="submit" variant="outline" disabled={pending}>
            {rejectPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {buyerCanRespondToCounter ? "Reject counter" : "Reject offer"}
          </Button>
        </form>

        {supplierCanRespond ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setShowCounterForm((value) => !value)}
          >
            Counter offer
          </Button>
        ) : null}
      </div>

      {supplierCanRespond && showCounterForm ? (
        <form action={counterAction} className="space-y-4 border-t border-border pt-4">
          <input type="hidden" name="offerId" value={offer.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="counterQuantity">Counter quantity ({offer.quantity_unit})</Label>
              <Input
                id="counterQuantity"
                name="quantity"
                type="number"
                min="0.01"
                step="any"
                max={offer.listing?.quantity ?? undefined}
                defaultValue={offer.quantity}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterPrice">Counter price</Label>
              <Input
                id="counterPrice"
                name="offeredPrice"
                type="number"
                min="0"
                step="any"
                defaultValue={offer.offered_price}
                required
                disabled={pending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="counterMessage">Message (optional)</Label>
            <Textarea
              id="counterMessage"
              name="message"
              rows={3}
              disabled={pending}
              placeholder="Explain your counter terms."
            />
          </div>
          <Button type="submit" disabled={pending}>
            {counterPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting counter…
              </>
            ) : (
              "Submit counteroffer"
            )}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
