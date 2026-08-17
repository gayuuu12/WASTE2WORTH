import sharp from "sharp"

const MAX_DIMENSION = 1280
const JPEG_QUALITY = 80

/** Skip re-encoding when already small enough for vision analysis. */
const SKIP_OPTIMIZE_BELOW_BYTES = 350_000

export async function optimizeAnalysisImage(
  input: Buffer,
  mimeType: string,
): Promise<{
  buffer: Buffer
  mimeType: string
  originalBytes: number
  optimizedBytes: number
  resized: boolean
}> {
  const originalBytes = input.length

  if (originalBytes <= SKIP_OPTIMIZE_BELOW_BYTES && mimeType === "image/jpeg") {
    return {
      buffer: input,
      mimeType,
      originalBytes,
      optimizedBytes: originalBytes,
      resized: false,
    }
  }

  const image = sharp(input, { failOn: "none" }).rotate()
  const metadata = await image.metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION

  let pipeline = image
  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
  }

  const buffer = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer()

  return {
    buffer,
    mimeType: "image/jpeg",
    originalBytes,
    optimizedBytes: buffer.length,
    resized: needsResize || mimeType !== "image/jpeg",
  }
}
