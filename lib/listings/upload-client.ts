"use client"

import { createClient } from "@/lib/supabase/client"
import {
  buildListingImagePath,
  buildStagingImagePath,
  getListingImagePublicUrl,
  LISTING_IMAGES_BUCKET,
  validateListingImageFiles,
  type UploadedImageRef,
} from "@/lib/listings/storage"

export async function uploadListingImagesClient(
  companyId: string,
  listingId: string | null,
  files: File[],
): Promise<UploadedImageRef[]> {
  const validationError = validateListingImageFiles(files)
  if (validationError) {
    throw new Error(validationError)
  }

  if (files.length === 0) {
    return []
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to upload images")
  }

  const uploadedPaths: string[] = []
  const results: UploadedImageRef[] = []

  try {
    for (const file of files) {
      const storagePath = listingId
        ? buildListingImagePath(companyId, listingId, file.name)
        : buildStagingImagePath(companyId, file.name)

      const { error } = await supabase.storage
        .from(LISTING_IMAGES_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        throw new Error(`Image upload failed: ${error.message}`)
      }

      uploadedPaths.push(storagePath)
      results.push({
        storagePath,
        imageUrl: getListingImagePublicUrl(storagePath),
      })
    }

    return results
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(uploadedPaths)
    }
    throw error
  }
}

export async function removeStagingImagesClient(storagePaths: string[]) {
  if (storagePaths.length === 0) return

  const supabase = createClient()
  await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(storagePaths)
}
