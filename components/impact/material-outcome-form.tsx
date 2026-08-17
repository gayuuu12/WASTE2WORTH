"use client"

import { useActionState } from "react"
import type { Transaction } from "@/lib/types"
import type { MaterialOutcome } from "@/lib/types"
import {
  saveMaterialOutcomeAction,
  confirmMaterialOutcomeAction,
  type MaterialOutcomeActionResult,
} from "@/lib/actions/material-outcomes"
import { MATERIAL_OUTCOME_LABELS, MATERIAL_OUTCOME_TYPES } from "@/lib/impact/constants"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const initialState: MaterialOutcomeActionResult = {}

export function MaterialOutcomeForm({
  transaction,
  existingOutcome,
}: {
  transaction: Transaction
  existingOutcome?: MaterialOutcome | null
}) {
  const [state, action, pending] = useActionState(saveMaterialOutcomeAction, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record material outcome</CardTitle>
        <p className="text-sm text-muted-foreground">
          Optional but encouraged — tell us what happened to this material after transfer.
        </p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="transactionId" value={transaction.id} />
          <input type="hidden" name="inputQuantityUnit" value={transaction.quantity_unit} />
          <input type="hidden" name="recoveredQuantityUnit" value={transaction.quantity_unit} />

          <FormSelect
            id="outcomeType"
            name="outcomeType"
            label="Outcome type"
            required
            defaultValue={existingOutcome?.outcome_type ?? "recycled"}
            options={MATERIAL_OUTCOME_TYPES.map((value) => ({
              value,
              label: MATERIAL_OUTCOME_LABELS[value],
            }))}
            disabled={pending}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inputQuantity">Transferred quantity ({transaction.quantity_unit})</Label>
              <Input
                id="inputQuantity"
                name="inputQuantity"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={existingOutcome?.input_quantity ?? transaction.quantity}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recoveredQuantity">
                Recovered quantity ({transaction.quantity_unit})
              </Label>
              <Input
                id="recoveredQuantity"
                name="recoveredQuantity"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={existingOutcome?.recovered_quantity ?? transaction.quantity}
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultingProduct">Resulting product</Label>
            <Input
              id="resultingProduct"
              name="resultingProduct"
              defaultValue={existingOutcome?.resulting_product ?? ""}
              placeholder="e.g. Recycled plastic boards"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processingMethod">Processing method (optional)</Label>
            <Input
              id="processingMethod"
              name="processingMethod"
              defaultValue={existingOutcome?.processing_method ?? ""}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={existingOutcome?.notes ?? ""}
              disabled={pending}
            />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <Button type="submit" disabled={pending}>
            {existingOutcome ? "Update outcome" : "Save outcome"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SupplierConfirmOutcomeForm({
  outcome,
  transactionId,
}: {
  outcome: MaterialOutcome
  transactionId: string
}) {
  const [state, action, pending] = useActionState(confirmMaterialOutcomeAction, initialState)

  if (outcome.verification_status !== "buyer_reported") return null

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="outcomeId" value={outcome.id} />
      <input type="hidden" name="transactionId" value={transactionId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Confirm reported outcome
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}
