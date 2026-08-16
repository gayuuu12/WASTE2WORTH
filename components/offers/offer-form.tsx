"use client"

import { useActionState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createOfferAction,
  type OfferActionResult,
} from "@/lib/actions/offers"
import { CURRENCIES } from "@/lib/constants"
import type { WasteListing } from "@/lib/types"
import { formatMoney, formatQuantity } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: OfferActionResult = {}

export function OfferForm({ listing }: { listing: WasteListing }) {
  const [state, formAction, pending] = useActionState(createOfferAction, initialState)

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="listingId" value={listing.id} />
      <input type="hidden" name="quantityUnit" value={listing.quantity_unit} />

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium">{listing.title}</p>
        <p className="text-muted-foreground">
          Available: {formatQuantity(listing.quantity, listing.quantity_unit)}
        </p>
        <p className="text-muted-foreground">
          Asking price: {formatMoney(listing.asking_price, listing.currency)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity">Offered quantity ({listing.quantity_unit})</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0.01"
            step="any"
            max={listing.quantity}
            required
            disabled={pending}
            placeholder={`Max ${listing.quantity}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offeredPrice">Offered price</Label>
          <Input
            id="offeredPrice"
            name="offeredPrice"
            type="number"
            min="0"
            step="any"
            required
            disabled={pending}
            defaultValue={listing.asking_price ?? undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={listing.currency}
            disabled={pending}
            required
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message to supplier (optional)</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          disabled={pending}
          placeholder="Include pickup preferences, timing, or quality expectations."
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting offer…
          </>
        ) : (
          "Submit offer"
        )}
      </Button>
    </form>
  )
}
