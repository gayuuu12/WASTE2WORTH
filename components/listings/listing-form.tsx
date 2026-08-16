"use client"

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createListingAction,
  updateListingAction,
  type ListingActionResult,
} from "@/lib/actions/listings"
import {
  AVAILABILITY_FREQUENCIES,
  CONDITIONS,
  CONTAMINATION_LEVELS,
  CURRENCIES,
  MOISTURE_LEVELS,
  PRICE_UNITS,
  QUANTITY_UNITS,
} from "@/lib/constants"
import { uploadListingImagesClient } from "@/lib/listings/upload-client"
import type { WasteCategory, WasteListing } from "@/lib/types"
import { ImageUploadField } from "@/components/listings/image-upload-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: ListingActionResult = {}

function optionalSelectOptions(values: readonly string[]) {
  return values
}

export function ListingForm({
  categories,
  listing,
  mode,
  defaultLocation,
  companyId,
}: {
  categories: WasteCategory[]
  listing?: WasteListing
  mode: "create" | "edit"
  defaultLocation?: { city?: string; state?: string; country?: string }
  companyId: string
}) {
  const action = mode === "create" ? createListingAction : updateListingAction
  const [state, formAction, actionPending] = useActionState(action, initialState)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [recurring, setRecurring] = useState(listing?.recurring ?? false)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const pending = isUploading || isPending || actionPending

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setIsUploading(true)
    try {
      const uploaded =
        imageFiles.length > 0
          ? await uploadListingImagesClient(
              companyId,
              mode === "edit" ? listing!.id : null,
              imageFiles,
            )
          : []

      formData.set("uploadedImages", JSON.stringify(uploaded))

      startTransition(() => {
        formAction(formData)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {mode === "edit" && listing ? (
        <input type="hidden" name="listingId" value={listing.id} />
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={listing?.title} required disabled={pending} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={listing?.description ?? ""}
              disabled={pending}
            />
          </div>

          <FormSelect
            id="categoryId"
            name="categoryId"
            label="Waste category"
            placeholder="Select category"
            defaultValue={listing?.category_id ?? undefined}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            disabled={pending || categories.length === 0}
            required
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Material details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="materialName">Material name</Label>
            <Input
              id="materialName"
              name="materialName"
              defaultValue={listing?.material_name}
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialGrade">Material grade</Label>
            <Input
              id="materialGrade"
              name="materialGrade"
              defaultValue={listing?.material_grade ?? ""}
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              defaultValue={listing?.quantity}
              required
              disabled={pending}
            />
          </div>

          <FormSelect
            id="quantityUnit"
            name="quantityUnit"
            label="Quantity unit"
            placeholder="Select unit"
            defaultValue={listing?.quantity_unit ?? "kg"}
            options={QUANTITY_UNITS}
            disabled={pending}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="minimumOrderQuantity">Minimum order quantity</Label>
            <Input
              id="minimumOrderQuantity"
              name="minimumOrderQuantity"
              type="number"
              min="0"
              step="any"
              defaultValue={listing?.minimum_order_quantity ?? ""}
              disabled={pending}
            />
          </div>

          <FormSelect
            id="condition"
            name="condition"
            label="Condition"
            placeholder="Select condition"
            defaultValue={listing?.condition ?? undefined}
            options={optionalSelectOptions(CONDITIONS)}
            disabled={pending}
          />

          <FormSelect
            id="contaminationLevel"
            name="contaminationLevel"
            label="Contamination level"
            placeholder="Select level"
            defaultValue={listing?.contamination_level ?? undefined}
            options={optionalSelectOptions(CONTAMINATION_LEVELS)}
            disabled={pending}
          />

          <FormSelect
            id="moistureLevel"
            name="moistureLevel"
            label="Moisture level"
            placeholder="Select level"
            defaultValue={listing?.moisture_level ?? undefined}
            options={optionalSelectOptions(MOISTURE_LEVELS)}
            disabled={pending}
          />

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="qualityNotes">Quality notes</Label>
            <Textarea
              id="qualityNotes"
              name="qualityNotes"
              rows={3}
              defaultValue={listing?.quality_notes ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="askingPrice">Asking price</Label>
            <Input
              id="askingPrice"
              name="askingPrice"
              type="number"
              min="0"
              step="any"
              defaultValue={listing?.asking_price ?? ""}
              disabled={pending}
            />
          </div>

          <FormSelect
            id="currency"
            name="currency"
            label="Currency"
            placeholder="Select currency"
            defaultValue={listing?.currency ?? "INR"}
            options={CURRENCIES}
            disabled={pending}
            required
          />

          <FormSelect
            id="priceUnit"
            name="priceUnit"
            label="Price unit"
            placeholder="Select price unit"
            defaultValue={listing?.price_unit ?? undefined}
            options={optionalSelectOptions(PRICE_UNITS)}
            disabled={pending}
          />

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox name="negotiable" defaultChecked={listing?.negotiable ?? true} disabled={pending} />
            Price is negotiable
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Availability</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={recurring}
              disabled={pending}
              onCheckedChange={(checked) => setRecurring(checked === true)}
            />
            Recurring availability
          </label>
          <input type="hidden" name="recurring" value={recurring ? "true" : "false"} />

          {recurring ? (
            <FormSelect
              id="availabilityFrequency"
              name="availabilityFrequency"
              label="Availability frequency"
              placeholder="Select frequency"
              defaultValue={listing?.availability_frequency ?? undefined}
              options={AVAILABILITY_FREQUENCIES}
              disabled={pending}
              required
            />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="availableFrom">Available from</Label>
            <Input
              id="availableFrom"
              name="availableFrom"
              type="date"
              defaultValue={listing?.available_from?.slice(0, 10) ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={listing?.city ?? defaultLocation?.city ?? ""}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              defaultValue={listing?.state ?? defaultLocation?.state ?? ""}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={listing?.country ?? defaultLocation?.country ?? ""}
              required
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Images</h2>
        <ImageUploadField
          existingImages={listing?.images}
          disabled={pending}
          onChange={({ newFiles }) => setImageFiles(newFiles)}
        />
      </section>

      {mode === "create" ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="publishNow" disabled={pending} />
          Publish immediately (make visible on marketplace)
        </label>
      ) : null}

      <Button type="submit" disabled={pending || categories.length === 0}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            {isUploading ? "Uploading images…" : "Saving…"}
          </>
        ) : mode === "create" ? (
          "Create listing"
        ) : (
          "Save changes"
        )}
      </Button>

      {categories.length === 0 ? (
        <p className="text-sm text-destructive">
          Waste categories are unavailable. Please contact support or seed categories in Supabase.
        </p>
      ) : null}
    </form>
  )
}
