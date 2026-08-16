"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createRequirementAction,
  updateRequirementAction,
  type RequirementActionResult,
} from "@/lib/actions/requirements"
import { CURRENCIES, QUANTITY_UNITS } from "@/lib/constants"
import { PREFERRED_QUALITY_OPTIONS } from "@/lib/matching/constants"
import type { BuyerRequirement, WasteCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: RequirementActionResult = {}

export function RequirementForm({
  categories,
  requirement,
  mode,
  defaultLocation,
}: {
  categories: WasteCategory[]
  requirement?: BuyerRequirement
  mode: "create" | "edit"
  defaultLocation?: { city?: string; state?: string; country?: string }
}) {
  const action = mode === "create" ? createRequirementAction : updateRequirementAction
  const [state, formAction, pending] = useActionState(action, initialState)
  const [recurring, setRecurring] = useState(requirement?.recurring ?? false)

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  return (
    <form action={formAction} className="space-y-8">
      {mode === "edit" && requirement ? (
        <input type="hidden" name="requirementId" value={requirement.id} />
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Requirement details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={requirement?.title} required disabled={pending} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={requirement?.description ?? ""}
              disabled={pending}
            />
          </div>

          <FormSelect
            id="categoryId"
            name="categoryId"
            label="Required category"
            placeholder="Select category"
            defaultValue={requirement?.category_id ?? undefined}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            disabled={pending || categories.length === 0}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="materialName">Required material</Label>
            <Input
              id="materialName"
              name="materialName"
              defaultValue={requirement?.material_name}
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desiredGrade">Required grade</Label>
            <Input
              id="desiredGrade"
              name="desiredGrade"
              defaultValue={requirement?.desired_grade ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Quantity & pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantityNeeded">Required quantity</Label>
            <Input
              id="quantityNeeded"
              name="quantityNeeded"
              type="number"
              min="0"
              step="any"
              defaultValue={requirement?.quantity_needed ?? undefined}
              required
              disabled={pending}
            />
          </div>

          <FormSelect
            id="quantityUnit"
            name="quantityUnit"
            label="Quantity unit"
            placeholder="Select unit"
            defaultValue={requirement?.quantity_unit ?? "kg"}
            options={QUANTITY_UNITS}
            disabled={pending}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="minimumAcceptableQuantity">Minimum acceptable quantity</Label>
            <Input
              id="minimumAcceptableQuantity"
              name="minimumAcceptableQuantity"
              type="number"
              min="0"
              step="any"
              defaultValue={requirement?.minimum_acceptable_quantity ?? ""}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Maximum price</Label>
            <Input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min="0"
              step="any"
              defaultValue={requirement?.max_price ?? ""}
              disabled={pending}
            />
          </div>

          <FormSelect
            id="currency"
            name="currency"
            label="Currency"
            placeholder="Select currency"
            defaultValue={requirement?.currency ?? "INR"}
            options={CURRENCIES}
            disabled={pending}
            required
          />

          <FormSelect
            id="preferredQuality"
            name="preferredQuality"
            label="Preferred quality"
            placeholder="Select quality preference"
            defaultValue={requirement?.preferred_quality ?? undefined}
            options={PREFERRED_QUALITY_OPTIONS}
            disabled={pending}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Location & timing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxDistanceKm">Maximum distance (km)</Label>
            <Input
              id="maxDistanceKm"
              name="maxDistanceKm"
              type="number"
              min="0"
              step="any"
              defaultValue={requirement?.max_distance_km ?? ""}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredBy">Required-by date</Label>
            <Input
              id="requiredBy"
              name="requiredBy"
              type="date"
              defaultValue={requirement?.required_by?.slice(0, 10) ?? ""}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={requirement?.preferred_city ?? defaultLocation?.city ?? ""}
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              defaultValue={requirement?.preferred_state ?? defaultLocation?.state ?? ""}
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={requirement?.preferred_country ?? defaultLocation?.country ?? ""}
              required
              disabled={pending}
            />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={recurring}
              disabled={pending}
              onCheckedChange={(checked) => setRecurring(checked === true)}
            />
            Recurring requirement
          </label>
          <input type="hidden" name="recurring" value={recurring ? "true" : "false"} />
        </div>
      </section>

      {mode === "create" ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="publishNow" disabled={pending} />
          Activate immediately (start matching against listings)
        </label>
      ) : null}

      <Button type="submit" disabled={pending || categories.length === 0}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Saving…
          </>
        ) : mode === "create" ? (
          "Create requirement"
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  )
}
