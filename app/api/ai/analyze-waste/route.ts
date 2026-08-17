import { NextResponse } from "next/server"
import { AnalysisTimings, analysisErrorHint, isRetryableAnalysisError } from "@/lib/ai/analysis-timings"
import { analyzeWasteImage } from "@/lib/ai/waste-analysis"
import { logAiRouteDev } from "@/lib/ai/dev-route-log"
import { optimizeAnalysisImage } from "@/lib/ai/optimize-analysis-image"
import { checkRateLimit } from "@/lib/ai/rate-limit"
import { isAiConfigured } from "@/lib/ai/config"
import { getAiErrorHint } from "@/lib/ai/errors"
import { AiProviderError } from "@/lib/ai/provider"
import { LISTING_IMAGE_ACCEPTED_TYPES, LISTING_IMAGE_MAX_BYTES } from "@/lib/listings/constants"
import { analyzeWasteRequestSchema } from "@/lib/validations/ai"
import { getSessionContext } from "@/lib/auth"
import { canCreateListings } from "@/lib/listings/auth"

export const runtime = "nodejs"

const USER_ANALYSIS_ERROR = "AI couldn't analyze this image right now."

export async function POST(request: Request) {
  const timings = new AnalysisTimings()
  let authenticated = false
  let providerCalled = false
  let errorKind: string | undefined
  let originalImageBytes: number | null = null
  let optimizedImageBytes: number | null = null

  try {
    if (!isAiConfigured()) {
      errorKind = "not_configured"
      const response = NextResponse.json(
        {
          error: USER_ANALYSIS_ERROR,
          errorHint: analysisErrorHint("not_configured"),
          retryable: false,
        },
        { status: 503 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 503,
        providerCalled,
        errorKind,
      })
      return response
    }

    const ctx = await getSessionContext()
    authenticated = Boolean(ctx?.user && ctx.company && canCreateListings(ctx.company))

    if (!ctx?.user || !ctx.company || !canCreateListings(ctx.company)) {
      errorKind = "unauthenticated"
      const response = NextResponse.json(
        { error: "Supplier access required.", retryable: false },
        { status: 401 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 401,
        providerCalled,
        errorKind,
      })
      return response
    }

    if (!checkRateLimit(`analyze-waste:${ctx.user.id}`, 8, 60_000)) {
      errorKind = "rate_limit"
      const response = NextResponse.json(
        {
          error: "Too many analysis requests. Please wait a minute and try again.",
          retryable: true,
          errorHint: "temporary_service",
        },
        { status: 429 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 429,
        providerCalled,
        errorKind,
      })
      return response
    }

    const formData = await request.formData()
    const image = formData.get("image")

    if (!(image instanceof File)) {
      errorKind = "validation_error"
      const response = NextResponse.json(
        { error: "Waste image is required.", retryable: false },
        { status: 400 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 400,
        providerCalled,
        errorKind,
      })
      return response
    }

    if (!LISTING_IMAGE_ACCEPTED_TYPES.includes(image.type as (typeof LISTING_IMAGE_ACCEPTED_TYPES)[number])) {
      errorKind = "validation_error"
      const response = NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF.", retryable: false },
        { status: 400 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 400,
        providerCalled,
        errorKind,
      })
      return response
    }

    if (image.size > LISTING_IMAGE_MAX_BYTES) {
      errorKind = "validation_error"
      const response = NextResponse.json(
        { error: "Image is too large. Maximum size is 5 MB.", retryable: false },
        { status: 400 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 400,
        providerCalled,
        errorKind,
      })
      return response
    }

    const parsedMeta = analyzeWasteRequestSchema.safeParse({
      quantity: Number(formData.get("quantity")),
      quantityUnit: String(formData.get("quantityUnit") ?? ""),
      sellerNote: String(formData.get("sellerNote") ?? "").trim() || undefined,
    })

    if (!parsedMeta.success) {
      errorKind = "validation_error"
      const response = NextResponse.json(
        {
          error: parsedMeta.error.issues[0]?.message ?? "Invalid input",
          retryable: false,
        },
        { status: 400 },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: 400,
        providerCalled,
        errorKind,
      })
      return response
    }

    const inputBuffer = Buffer.from(await image.arrayBuffer())
    originalImageBytes = inputBuffer.length

    const optimized = await optimizeAnalysisImage(inputBuffer, image.type)
    optimizedImageBytes = optimized.optimizedBytes
    timings.mark("image_preparation")

    const imageBase64 = optimized.buffer.toString("base64")

    providerCalled = true
    const analysis = await analyzeWasteImage({
      imageBase64,
      mimeType: optimized.mimeType,
      quantity: parsedMeta.data.quantity,
      quantityUnit: parsedMeta.data.quantityUnit,
      sellerNote: parsedMeta.data.sellerNote,
    })

    timings.mark("total")

    timings.logDev({
      originalImageBytes,
      optimizedImageBytes,
      imageResized: optimized.resized,
      inputMimeType: image.type,
      outputMimeType: optimized.mimeType,
    })

    const response = NextResponse.json({ analysis })
    logAiRouteDev("analyze-waste", request, {
      authenticated,
      responseStatus: 200,
      providerCalled,
    })
    return response
  } catch (error) {
    timings.mark("total")

    if (error instanceof AiProviderError) {
      errorKind = error.kind
      if (process.env.NODE_ENV === "development") {
        console.error("[AI analyze-waste] request failed:", {
          provider: error.provider,
          kind: error.kind,
          httpStatus: error.httpStatus,
          providerType: error.providerType,
          providerCode: error.providerCode,
          model: error.model,
          endpoint: error.endpoint,
          hint: getAiErrorHint(error.kind, error.provider),
        })
      }

      timings.logDev({
        originalImageBytes,
        optimizedImageBytes,
        errorKind: error.kind,
      })

      const response = NextResponse.json(
        {
          error: USER_ANALYSIS_ERROR,
          errorHint: analysisErrorHint(error.kind),
          retryable: isRetryableAnalysisError(error.kind),
        },
        { status: error.statusCode },
      )
      logAiRouteDev("analyze-waste", request, {
        authenticated,
        responseStatus: error.statusCode,
        providerCalled,
        errorKind,
      })
      return response
    }

    errorKind = "unknown"
    timings.logDev({ originalImageBytes, optimizedImageBytes, errorKind })

    const response = NextResponse.json(
      {
        error: USER_ANALYSIS_ERROR,
        errorHint: "temporary_service",
        retryable: true,
      },
      { status: 500 },
    )
    logAiRouteDev("analyze-waste", request, {
      authenticated,
      responseStatus: 500,
      providerCalled,
      errorKind,
    })
    return response
  }
}
