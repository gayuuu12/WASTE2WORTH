"use client"

import { useId, useState } from "react"
import Image from "next/image"
import { X, Upload } from "lucide-react"
import {
  LISTING_IMAGE_ACCEPTED_EXTENSIONS,
  LISTING_IMAGE_MAX_COUNT,
} from "@/lib/listings/constants"
import { validateListingImageFile } from "@/lib/listings/storage"
import type { ListingImage } from "@/lib/types"
import { Button } from "@/components/ui/button"

type PreviewItem = {
  id: string
  url: string
  file?: File
  existing?: ListingImage
}

export function ImageUploadField({
  existingImages = [],
  disabled,
  onChange,
  id: providedId,
}: {
  existingImages?: ListingImage[]
  disabled?: boolean
  onChange?: (payload: { newFiles: File[]; removedIds: string[] }) => void
  id?: string
}) {
  const [previews, setPreviews] = useState<PreviewItem[]>(() =>
    existingImages.map((img) => ({
      id: img.id,
      url: img.image_url,
      existing: img,
    })),
  )
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const generatedId = useId()
  const inputId = providedId ?? `listing-images-${generatedId.replace(/:/g, "")}`

  function notify(nextPreviews: PreviewItem[], nextRemoved: string[]) {
    onChange?.({
      newFiles: nextPreviews.filter((p) => p.file).map((p) => p.file!),
      removedIds: nextRemoved,
    })
  }

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    setError(null)

    const incoming = Array.from(selected)
    if (previews.length + incoming.length > LISTING_IMAGE_MAX_COUNT) {
      setError(`You can upload up to ${LISTING_IMAGE_MAX_COUNT} images total`)
      return
    }

    const nextItems: PreviewItem[] = []

    for (const file of incoming) {
      const validationError = validateListingImageFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      nextItems.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      })
    }

    const nextPreviews = [...previews, ...nextItems]
    setPreviews(nextPreviews)
    notify(nextPreviews, removedIds)
  }

  function removePreview(id: string) {
    const target = previews.find((item) => item.id === id)
    let nextRemoved = removedIds

    if (target?.existing) {
      nextRemoved = [...removedIds, target.existing.id]
      setRemovedIds(nextRemoved)
    }

    if (target?.file) {
      URL.revokeObjectURL(target.url)
    }

    const nextPreviews = previews.filter((item) => item.id !== id)
    setPreviews(nextPreviews)
    notify(nextPreviews, nextRemoved)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Images</p>
          <p className="text-xs text-muted-foreground">
            Up to {LISTING_IMAGE_MAX_COUNT} images · 5 MB each · JPEG, PNG, WebP, GIF
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular">
          {previews.length}/{LISTING_IMAGE_MAX_COUNT}
        </span>
      </div>

      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image
                src={preview.url}
                alt="Listing preview"
                fill
                className="object-cover"
                unoptimized
              />
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removePreview(preview.id)}
                  className="absolute top-1.5 right-1.5 rounded-md bg-background/90 p-1 shadow-sm"
                  aria-label="Remove image"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!disabled ? (
        <div>
          <label htmlFor={inputId} className="sr-only">
            Upload listing images
          </label>
          <input
            id={inputId}
            type="file"
            accept={LISTING_IMAGE_ACCEPTED_EXTENSIONS.join(",")}
            multiple
            className="sr-only"
            disabled={disabled || previews.length >= LISTING_IMAGE_MAX_COUNT}
            onChange={(event) => {
              handleFiles(event.target.files)
              event.target.value = ""
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || previews.length >= LISTING_IMAGE_MAX_COUNT}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <Upload />
            Add images
          </Button>
        </div>
      ) : null}

      {removedIds.map((id) => (
        <input key={id} type="hidden" name="removeImageIds" value={id} readOnly />
      ))}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
