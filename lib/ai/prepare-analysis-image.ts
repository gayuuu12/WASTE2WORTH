const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.8

/** Skip client compression when the file is already small JPEG. */
const SKIP_BELOW_BYTES = 350_000

export async function prepareAnalysisImage(file: File): Promise<{
  file: File
  originalBytes: number
  optimizedBytes: number
}> {
  const originalBytes = file.size

  if (originalBytes <= SKIP_BELOW_BYTES && file.type === "image/jpeg") {
    return { file, originalBytes, optimizedBytes: originalBytes }
  }

  const bitmap = await createImageBitmap(file)
  try {
    const longestEdge = Math.max(bitmap.width, bitmap.height)
    const scale = longestEdge > MAX_DIMENSION ? MAX_DIMENSION / longestEdge : 1
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Could not prepare image for analysis.")
    }

    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else reject(new Error("Could not compress image for analysis."))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, "") || "material"
    const optimized = new File([blob], `${baseName}-analysis.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    })

    return {
      file: optimized,
      originalBytes,
      optimizedBytes: optimized.size,
    }
  } finally {
    bitmap.close()
  }
}
