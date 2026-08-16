import {
  LISTING_IMAGES_BUCKET,
  LISTING_IMAGE_ACCEPTED_TYPES,
  LISTING_IMAGE_MAX_BYTES,
  LISTING_IMAGE_MAX_COUNT,
} from "@/lib/listings/constants"

export function getListingImagePublicUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return storagePath
  return `${base}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/${storagePath}`
}

export function validateListingImageFile(file: File): string | null {
  if (!LISTING_IMAGE_ACCEPTED_TYPES.includes(file.type as (typeof LISTING_IMAGE_ACCEPTED_TYPES)[number])) {
    return `${file.name}: only JPEG, PNG, WebP, and GIF images are allowed`
  }

  if (file.size > LISTING_IMAGE_MAX_BYTES) {
    return `${file.name}: file must be 5 MB or smaller`
  }

  return null
}

export function validateListingImageFiles(files: File[]): string | null {
  const validFiles = files.filter((f) => f.size > 0)

  if (validFiles.length > LISTING_IMAGE_MAX_COUNT) {
    return `You can upload up to ${LISTING_IMAGE_MAX_COUNT} images`
  }

  for (const file of validFiles) {
    const error = validateListingImageFile(file)
    if (error) return error
  }

  return null
}

export function buildListingImagePath(
  companyId: string,
  listingId: string,
  fileName: string,
) {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg"
  const safeExt = ext?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  return `${companyId}/${listingId}/${randomFileId()}.${safeExt}`
}

export function buildStagingImagePath(companyId: string, fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg"
  const safeExt = ext?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  return `${companyId}/staging/${randomFileId()}.${safeExt}`
}

function randomFileId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export interface UploadedImageRef {
  storagePath: string
  imageUrl: string
}

export function isAllowedUploadPath(
  storagePath: string,
  companyId: string,
  listingId?: string,
): boolean {
  if (!storagePath.startsWith(`${companyId}/`)) return false

  if (storagePath.startsWith(`${companyId}/staging/`)) return true

  if (listingId && storagePath.startsWith(`${companyId}/${listingId}/`)) {
    return true
  }

  return false
}

export { LISTING_IMAGES_BUCKET, LISTING_IMAGE_MAX_COUNT }
