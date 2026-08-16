"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireSupplierContext, requireOwnedListing } from "@/lib/listings/auth"
import {
  getListingImagePublicUrl,
  isAllowedUploadPath,
  LISTING_IMAGES_BUCKET,
  LISTING_IMAGE_MAX_COUNT,
  type UploadedImageRef,
} from "@/lib/listings/storage"
import { listingFormSchema } from "@/lib/validations/listings"
import { createClient } from "@/lib/supabase/server"
import type { ListingStatus } from "@/lib/types"

export type ListingActionResult = {
  error?: string
  success?: boolean
}

function parseListingForm(formData: FormData) {
  return listingFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    materialName: formData.get("materialName"),
    materialGrade: formData.get("materialGrade") || undefined,
    quantity: formData.get("quantity"),
    quantityUnit: formData.get("quantityUnit"),
    minimumOrderQuantity: formData.get("minimumOrderQuantity") || undefined,
    condition: formData.get("condition") || undefined,
    contaminationLevel: formData.get("contaminationLevel") || undefined,
    moistureLevel: formData.get("moistureLevel") || undefined,
    qualityNotes: formData.get("qualityNotes") || undefined,
    askingPrice: formData.get("askingPrice") || undefined,
    currency: formData.get("currency"),
    priceUnit: formData.get("priceUnit") || undefined,
    negotiable: formData.get("negotiable"),
    recurring: formData.get("recurring"),
    availabilityFrequency: formData.get("availabilityFrequency") || undefined,
    availableFrom: formData.get("availableFrom") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    publishNow: formData.get("publishNow"),
  })
}

function listingPayload(
  data: ReturnType<typeof listingFormSchema.parse>,
  companyId: string,
  userId: string,
  status: ListingStatus,
) {
  return {
    supplier_company_id: companyId,
    created_by: userId,
    title: data.title,
    description: data.description?.trim() || null,
    category_id: data.categoryId,
    material_name: data.materialName,
    material_grade: data.materialGrade?.trim() || null,
    quantity: data.quantity,
    quantity_unit: data.quantityUnit,
    minimum_order_quantity: data.minimumOrderQuantity ?? null,
    condition: data.condition ?? null,
    contamination_level: data.contaminationLevel ?? null,
    moisture_level: data.moistureLevel ?? null,
    quality_notes: data.qualityNotes?.trim() || null,
    asking_price: data.askingPrice ?? null,
    currency: data.currency,
    price_unit: data.priceUnit ?? null,
    negotiable: data.negotiable,
    recurring: data.recurring,
    availability_frequency: data.recurring ? data.availabilityFrequency ?? null : null,
    available_from: data.availableFrom || null,
    city: data.city,
    state: data.state,
    country: data.country,
    status,
  }
}

function parseUploadedImages(
  formData: FormData,
  companyId: string,
  listingId?: string,
): UploadedImageRef[] {
  const raw = formData.get("uploadedImages")
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    throw new Error("Invalid image upload data")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid image upload data")
  }

  if (parsed.length > LISTING_IMAGE_MAX_COUNT) {
    throw new Error(`You can upload up to ${LISTING_IMAGE_MAX_COUNT} images`)
  }

  const images: UploadedImageRef[] = []

  for (const item of parsed) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as UploadedImageRef).storagePath !== "string" ||
      typeof (item as UploadedImageRef).imageUrl !== "string"
    ) {
      throw new Error("Invalid image upload data")
    }

    const { storagePath, imageUrl } = item as UploadedImageRef

    if (!isAllowedUploadPath(storagePath, companyId, listingId)) {
      throw new Error("Invalid image upload path")
    }

    const expectedUrl = getListingImagePublicUrl(storagePath)
    if (imageUrl !== expectedUrl) {
      throw new Error("Invalid image URL")
    }

    images.push({ storagePath, imageUrl })
  }

  return images
}

async function cleanupStoragePaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePaths: string[],
) {
  if (storagePaths.length === 0) return
  await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(storagePaths)
}

async function insertListingImagesFromPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  images: UploadedImageRef[],
) {
  if (images.length === 0) return

  for (const image of images) {
    const { error: imageRowError } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      storage_path: image.storagePath,
      image_url: image.imageUrl,
    })

    if (imageRowError) {
      throw new Error(`Could not save image metadata: ${imageRowError.message}`)
    }
  }
}

async function removeListingImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  companyId: string,
  removeIds: string[],
) {
  if (removeIds.length === 0) return

  const listing = await requireOwnedListing(listingId, companyId)
  const toRemove = (listing.images ?? []).filter((img) => removeIds.includes(img.id))

  for (const image of toRemove) {
    await supabase.storage.from(LISTING_IMAGES_BUCKET).remove([image.storage_path])
    await supabase.from("listing_images").delete().eq("id", image.id)
  }
}

export async function createListingAction(
  _prev: ListingActionResult,
  formData: FormData,
): Promise<ListingActionResult> {
  const ctx = await requireSupplierContext()
  const parsed = parseListingForm(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid listing data" }
  }

  const supabase = await createClient()
  const status: ListingStatus = parsed.data.publishNow ? "active" : "draft"

  let uploadedImages: UploadedImageRef[] = []
  let listingId: string | null = null

  try {
    uploadedImages = parseUploadedImages(formData, ctx.company.id)

    const { data: listing, error } = await supabase
      .from("waste_listings")
      .insert(listingPayload(parsed.data, ctx.company.id, ctx.user.id, status))
      .select("id")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    listingId = listing.id
    await insertListingImagesFromPaths(supabase, listing.id, uploadedImages)
  } catch (error) {
    if (listingId) {
      await supabase.from("listing_images").delete().eq("listing_id", listingId)
      await supabase.from("waste_listings").delete().eq("id", listingId)
    }

    await cleanupStoragePaths(
      supabase,
      uploadedImages.map((image) => image.storagePath),
    )

    return {
      error: error instanceof Error ? error.message : "Could not create listing",
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/listings")
  revalidatePath("/marketplace")
  redirect(`/dashboard/listings/${listingId}`)
}

export async function updateListingAction(
  _prev: ListingActionResult,
  formData: FormData,
): Promise<ListingActionResult> {
  const ctx = await requireSupplierContext()
  const listingId = String(formData.get("listingId") ?? "")

  if (!listingId) {
    return { error: "Listing ID is required" }
  }

  const existing = await requireOwnedListing(listingId, ctx.company.id)

  const parsed = parseListingForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid listing data" }
  }

  const supabase = await createClient()
  const keepStatus =
    existing.status === "active" || existing.status === "inactive"
      ? existing.status
      : parsed.data.publishNow
        ? "active"
        : "draft"

  const removeIds = formData.getAll("removeImageIds").map(String).filter(Boolean)
  let uploadedImages: UploadedImageRef[] = []

  try {
    uploadedImages = parseUploadedImages(formData, ctx.company.id, listingId)

    const remainingExisting =
      (existing.images?.length ?? 0) -
      removeIds.filter((id) => existing.images?.some((img) => img.id === id)).length

    if (remainingExisting + uploadedImages.length > LISTING_IMAGE_MAX_COUNT) {
      throw new Error(`You can upload up to ${LISTING_IMAGE_MAX_COUNT} images`)
    }

    const fullPayload = listingPayload(parsed.data, ctx.company.id, ctx.user.id, keepStatus)
    const { supplier_company_id: _s, created_by: _c, ...updates } = fullPayload

    const { error } = await supabase
      .from("waste_listings")
      .update(updates)
      .eq("id", listingId)
      .eq("supplier_company_id", ctx.company.id)

    if (error) {
      throw new Error(error.message)
    }

    await removeListingImages(supabase, listingId, ctx.company.id, removeIds)
    await insertListingImagesFromPaths(supabase, listingId, uploadedImages)
  } catch (error) {
    await cleanupStoragePaths(
      supabase,
      uploadedImages.map((image) => image.storagePath),
    )

    return {
      error: error instanceof Error ? error.message : "Could not update listing",
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/listings")
  revalidatePath(`/dashboard/listings/${listingId}`)
  revalidatePath("/marketplace")
  redirect(`/dashboard/listings/${listingId}`)
}

export async function toggleListingStatusAction(listingId: string) {
  const ctx = await requireSupplierContext()
  const listing = await requireOwnedListing(listingId, ctx.company.id)

  const nextStatus: ListingStatus =
    listing.status === "active" ? "inactive" : "active"

  if (listing.status !== "active" && listing.status !== "inactive" && listing.status !== "draft") {
    return { error: "This listing status cannot be toggled" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("waste_listings")
    .update({ status: nextStatus })
    .eq("id", listingId)
    .eq("supplier_company_id", ctx.company.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/listings")
  revalidatePath(`/dashboard/listings/${listingId}`)
  revalidatePath("/marketplace")
  revalidatePath("/dashboard")

  return { success: true, status: nextStatus }
}

export async function deleteListingAction(listingId: string) {
  const ctx = await requireSupplierContext()
  const listing = await requireOwnedListing(listingId, ctx.company.id)

  if (!["draft", "inactive"].includes(listing.status)) {
    return { error: "Only draft or inactive listings can be deleted" }
  }

  const supabase = await createClient()

  for (const image of listing.images ?? []) {
    await supabase.storage.from(LISTING_IMAGES_BUCKET).remove([image.storage_path])
  }

  await supabase.from("listing_images").delete().eq("listing_id", listingId)

  const { error } = await supabase
    .from("waste_listings")
    .delete()
    .eq("id", listingId)
    .eq("supplier_company_id", ctx.company.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/listings")
  revalidatePath("/dashboard")
  revalidatePath("/marketplace")
  redirect("/dashboard/listings")
}
