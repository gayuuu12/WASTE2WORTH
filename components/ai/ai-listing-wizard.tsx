"use client"

import Link from "next/link"
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import { Loader2, MapPin, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel"
import {
  AiAnalysisProgress,
  type AnalysisStage,
} from "@/components/ai/ai-analysis-progress"
import { AiConfidenceBadge, AiSuggestedBadge } from "@/components/ai/ai-confidence-badge"
import { AiProgressSteps } from "@/components/ai/ai-progress-steps"
import {
  createListingAction,
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
import { findSimilarActiveListings } from "@/lib/ai/duplicate-check"
import {
  computeListingQuality,
  getQualityLabel,
} from "@/lib/ai/listing-quality"
import { getConfidenceLevel } from "@/lib/ai/confidence"
import { prepareAnalysisImage } from "@/lib/ai/prepare-analysis-image"
import { uploadListingImagesClient } from "@/lib/listings/upload-client"
import type { WasteAnalysisResult } from "@/lib/validations/ai"
import type { WasteCategory, WasteListing } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const initialState: ListingActionResult = {}

type AnalysisErrorState = {
  message: string
  hint?: "temporary_service"
  retryable: boolean
}

type FormState = {
  title: string
  description: string
  categoryId: string
  materialName: string
  materialGrade: string
  quantity: string
  quantityUnit: string
  condition: string
  contaminationLevel: string
  moistureLevel: string
  qualityNotes: string
  askingPrice: string
  currency: string
  priceUnit: string
  negotiable: boolean
  recurring: boolean
  availabilityFrequency: string
  city: string
  state: string
  country: string
}

export function AiListingWizard({
  categories,
  companyId,
  existingListings,
  defaultLocation,
  aiAvailable,
}: {
  categories: WasteCategory[]
  companyId: string
  existingListings: WasteListing[]
  defaultLocation?: { city?: string; state?: string; country?: string }
  aiAvailable: boolean
}) {
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sellerNote, setSellerNote] = useState("")
  const [analysis, setAnalysis] = useState<WasteAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage | null>(null)
  const [analysisError, setAnalysisError] = useState<AnalysisErrorState | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [locationManual, setLocationManual] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false)
  const [publishNow, setPublishNow] = useState(false)

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    categoryId: "",
    materialName: "",
    materialGrade: "",
    quantity: "",
    quantityUnit: "kg",
    condition: "",
    contaminationLevel: "",
    moistureLevel: "",
    qualityNotes: "",
    askingPrice: "",
    currency: "INR",
    priceUnit: "per_kg",
    negotiable: true,
    recurring: false,
    availabilityFrequency: "",
    city: defaultLocation?.city ?? "",
    state: defaultLocation?.state ?? "",
    country: defaultLocation?.country ?? "",
  })

  const [state, formAction, actionPending] = useActionState(createListingAction, initialState)
  const [isUploading, setIsUploading] = useState(false)
  const [, startTransition] = useTransition()

  const pending = isUploading || actionPending || isAnalyzing || locationLoading

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  const quality = useMemo(
    () =>
      computeListingQuality({
        title: form.title,
        materialName: form.materialName,
        quantity: Number(form.quantity),
        askingPrice: form.askingPrice ? Number(form.askingPrice) : null,
        city: form.city,
        state: form.state,
        country: form.country,
        description: form.description,
        hasImage: Boolean(imageFile),
      }),
    [form, imageFile],
  )

  const similarListings = useMemo(() => {
    if (!form.categoryId || !form.materialName) return []
    return findSimilarActiveListings(existingListings, {
      categoryId: form.categoryId,
      materialName: form.materialName,
      title: form.title,
    })
  }, [existingListings, form.categoryId, form.materialName, form.title])

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleImageChange(file: File | null) {
    setImageFile(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not supported in this browser.")
      setLocationManual(true)
      return
    }

    setLocationLoading(true)
    setLocationStatus("Finding your location...")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus("Location found — identifying city...")
        try {
          const response = await fetch("/api/ai/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error ?? "Location lookup failed")
          }
          updateForm("city", data.city)
          updateForm("state", data.state)
          updateForm("country", data.country)
          setLocationManual(false)
          setLocationStatus(null)
          toast.success("Location filled from your device")
        } catch (error) {
          setLocationStatus(null)
          toast.error(
            error instanceof Error
              ? error.message
              : "Location permission was not granted. Please enter your location manually.",
          )
          setLocationManual(true)
        } finally {
          setLocationLoading(false)
        }
      },
      () => {
        setLocationStatus(null)
        toast.error(
          "Location permission was not granted. Please enter your location manually.",
        )
        setLocationManual(true)
        setLocationLoading(false)
      },
      { enableHighAccuracy: false, timeout: 15000 },
    )
  }

  function applyAnalysisToForm(result: WasteAnalysisResult) {
    const category = categories.find((c) => c.slug === result.category)
    setForm((prev) => ({
      ...prev,
      title: result.title,
      description: result.description,
      categoryId: category?.id ?? prev.categoryId,
      materialName: result.material_name,
      materialGrade: result.material_grade ?? "",
      condition: result.condition,
      contaminationLevel: result.contamination_level,
      moistureLevel: result.moisture_level,
      qualityNotes: result.quality_notes,
    }))
  }

  function cancelAnalysis() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsAnalyzing(false)
    setAnalysisStage(null)
    setStep(1)
  }

  async function handleAnalyze() {
    if (!imageFile) {
      toast.error("Please upload a waste image first.")
      return
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Please enter a valid quantity.")
      return
    }

    setAnalysisError(null)
    setIsAnalyzing(true)
    setStep(2)
    setAnalysisStage("preparing")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { file: analysisImage } = await prepareAnalysisImage(imageFile)
      if (controller.signal.aborted) return

      setAnalysisStage("sending")
      const body = new FormData()
      body.set("image", analysisImage)
      body.set("quantity", form.quantity)
      body.set("quantityUnit", form.quantityUnit)
      if (sellerNote.trim()) body.set("sellerNote", sellerNote.trim())

      setAnalysisStage("analyzing")
      const response = await fetch("/api/ai/analyze-waste", {
        method: "POST",
        credentials: "same-origin",
        signal: controller.signal,
        body,
      })

      if (controller.signal.aborted) return

      setAnalysisStage("preparing_suggestions")
      const data = (await response.json()) as {
        analysis?: WasteAnalysisResult
        error?: string
        errorHint?: "temporary_service"
        retryable?: boolean
      }

      if (!response.ok) {
        setAnalysisError({
          message: data.error ?? "AI couldn't analyze this image right now.",
          hint: data.errorHint,
          retryable: data.retryable ?? true,
        })
        setStep(1)
        return
      }

      if (!data.analysis) {
        setAnalysisError({
          message: "AI couldn't analyze this image right now.",
          hint: "temporary_service",
          retryable: true,
        })
        setStep(1)
        return
      }

      setAnalysisStage("ready")
      setAnalysis(data.analysis)
      applyAnalysisToForm(data.analysis)
      setStep(3)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setAnalysisError({
        message: "AI couldn't analyze this image right now.",
        hint: "temporary_service",
        retryable: true,
      })
      setStep(1)
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setIsAnalyzing(false)
      setAnalysisStage(null)
    }
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!imageFile) {
      toast.error("Please upload an image.")
      return
    }

    if (!form.city.trim() || !form.state.trim() || !form.country.trim()) {
      toast.error("Please add your location before publishing.")
      setStep(1)
      return
    }

    if (similarListings.length > 0 && !ignoreDuplicate) {
      toast.error("Please review the similar listing warning before publishing.")
      setStep(5)
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set("uploadedImages", "[]")

    setIsUploading(true)
    try {
      const uploaded = await uploadListingImagesClient(companyId, null, [imageFile])
      formData.set("uploadedImages", JSON.stringify(uploaded))
      formData.set("publishNow", publishNow ? "true" : "false")
      formData.set("recurring", form.recurring ? "true" : "false")

      startTransition(() => {
        formAction(formData)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const lowConfidence = analysis ? getConfidenceLevel(analysis.confidence) === "low" : false

  return (
    <div className="space-y-6">
      <AiProgressSteps currentStep={step} />

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1 — Upload & basics</CardTitle>
            <p className="text-sm text-muted-foreground">
              You only need an image and quantity. AI will help with the rest after you analyze.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="waste-image">Material photo</Label>
              <label
                htmlFor="waste-image"
                className={cn(
                  "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:bg-muted/50",
                  imagePreview && "border-solid",
                )}
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Waste preview"
                    className="max-h-48 rounded-md object-contain"
                  />
                ) : (
                  <>
                    <Sparkles className="mb-2 size-8 text-muted-foreground" aria-hidden />
                    <p className="font-medium">Upload a clear photo of your material</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      JPEG, PNG, WebP, or GIF
                    </p>
                  </>
                )}
              </label>
              <Input
                id="waste-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={pending}
                className="sr-only"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  disabled={pending}
                  onChange={(e) => updateForm("quantity", e.target.value)}
                  required
                />
              </div>
              <FormSelect
                id="quantityUnit"
                label="Quantity unit"
                value={form.quantityUnit}
                options={QUANTITY_UNITS}
                disabled={pending}
                onChange={(e) => updateForm("quantityUnit", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerNote">Seller note (optional)</Label>
              <Textarea
                id="sellerNote"
                rows={2}
                placeholder="Example: Leftover cotton cutting waste from garment production."
                value={sellerNote}
                disabled={pending}
                onChange={(e) => setSellerNote(e.target.value)}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label>Location</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional for AI analysis. Required before publishing.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  className="min-h-11"
                  onClick={handleUseLocation}
                >
                  {locationLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MapPin />
                  )}
                  Use my location
                </Button>
              </div>

              {locationStatus ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {locationStatus}
                </p>
              ) : null}

              {locationManual ? (
                <p className="text-xs text-muted-foreground">
                  Enter city, state, and country manually — you can continue while location loads.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    disabled={pending}
                    onChange={(e) => updateForm("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    disabled={pending}
                    onChange={(e) => updateForm("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    disabled={pending}
                    onChange={(e) => updateForm("country", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {analysisError ? (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                role="alert"
              >
                <p className="font-medium">{analysisError.message}</p>
                {analysisError.hint === "temporary_service" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    This may be a temporary AI service issue.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysisError.retryable ? (
                    <Button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !aiAvailable}
                    >
                      Try again
                    </Button>
                  ) : null}
                  <Link href="/dashboard/listings/new">
                    <Button type="button" variant="outline">
                      Continue manually
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="lg"
                disabled={isAnalyzing || !aiAvailable}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Analyze Material
                  </>
                )}
              </Button>
              <Link href="/dashboard/listings/new">
                <Button type="button" variant="outline" size="lg">
                  Switch to Manual
                </Button>
              </Link>
            </div>

            {!aiAvailable ? (
              <p className="text-sm text-destructive">
                AI is not configured. Use Manual Listing or ask your administrator to set
                AI_PROVIDER_API_KEY.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 && isAnalyzing && analysisStage ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
            <div className="space-y-2">
              <p className="font-medium">Analyzing your material</p>
              <p className="text-sm text-muted-foreground">
                AI suggestions should be reviewed before publishing.
              </p>
            </div>
            <AiAnalysisProgress stage={analysisStage} />
            <Button type="button" variant="outline" onClick={cancelAnalysis}>
              Cancel analysis
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step >= 3 && analysis ? (
        <>
          {lowConfidence ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              AI is not confident. Please verify all fields carefully or{" "}
              <Link href="/dashboard/listings/new" className="underline">
                switch to Manual Listing
              </Link>
              .
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <AiAnalysisPanel analysis={analysis} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Step 3 — Review AI suggestions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Edit anything before continuing. Nothing is published until you confirm.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Simple mode</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced((v) => !v)}
                    >
                      {showAdvanced ? "Hide advanced details" : "Advanced details"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="title">Listing title</Label>
                      <AiSuggestedBadge />
                    </div>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="materialName">Material name</Label>
                      <AiSuggestedBadge />
                    </div>
                    <Input
                      id="materialName"
                      value={form.materialName}
                      onChange={(e) => updateForm("materialName", e.target.value)}
                    />
                  </div>

                  <FormSelect
                    id="categoryId"
                    label="Category"
                    value={form.categoryId}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={(e) => updateForm("categoryId", e.target.value)}
                    required
                  />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description">Description</Label>
                      <AiSuggestedBadge />
                    </div>
                    <Textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                    />
                  </div>

                  {showAdvanced ? (
                    <div className="space-y-4 rounded-lg border border-dashed p-4">
                      <p className="text-sm font-medium">Advanced details</p>
                      <div className="space-y-2">
                        <Label htmlFor="materialGrade">Material grade</Label>
                        <Input
                          id="materialGrade"
                          value={form.materialGrade}
                          onChange={(e) => updateForm("materialGrade", e.target.value)}
                        />
                      </div>
                      <FormSelect
                        id="condition"
                        label="How clean is the material?"
                        value={form.condition}
                        options={CONDITIONS}
                        onChange={(e) => updateForm("condition", e.target.value)}
                      />
                      <FormSelect
                        id="contaminationLevel"
                        label="Contamination level"
                        value={form.contaminationLevel}
                        options={CONTAMINATION_LEVELS}
                        onChange={(e) => updateForm("contaminationLevel", e.target.value)}
                      />
                      <FormSelect
                        id="moistureLevel"
                        label="Moisture level"
                        value={form.moistureLevel}
                        options={MOISTURE_LEVELS}
                        onChange={(e) => updateForm("moistureLevel", e.target.value)}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="qualityNotes">Technical notes</Label>
                        <Textarea
                          id="qualityNotes"
                          rows={3}
                          value={form.qualityNotes}
                          onChange={(e) => updateForm("qualityNotes", e.target.value)}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.recurring}
                          onCheckedChange={(checked) =>
                            updateForm("recurring", checked === true)
                          }
                        />
                        Recurring availability
                      </label>
                      {form.recurring ? (
                        <FormSelect
                          id="availabilityFrequency"
                          label="How often is it available?"
                          value={form.availabilityFrequency}
                          options={AVAILABILITY_FREQUENCIES}
                          onChange={(e) =>
                            updateForm("availabilityFrequency", e.target.value)
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => setStep(4)}>
                      Continue to price
                    </Button>
                    <Button type="button" variant="outline" onClick={handleAnalyze}>
                      Analyze again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {step === 4 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 4 — Set your price</CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI does not set prices. Enter your asking price manually.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="askingPrice">Asking price</Label>
                  <Input
                    id="askingPrice"
                    type="number"
                    min="0"
                    step="any"
                    value={form.askingPrice}
                    onChange={(e) => updateForm("askingPrice", e.target.value)}
                    required
                  />
                </div>
                <FormSelect
                  id="currency"
                  label="Currency"
                  value={form.currency}
                  options={CURRENCIES}
                  onChange={(e) => updateForm("currency", e.target.value)}
                  required
                />
                <FormSelect
                  id="priceUnit"
                  label="Price unit"
                  value={form.priceUnit}
                  options={PRICE_UNITS}
                  onChange={(e) => updateForm("priceUnit", e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Checkbox
                    checked={form.negotiable}
                    onCheckedChange={(checked) =>
                      updateForm("negotiable", checked === true)
                    }
                  />
                  Price is negotiable
                </label>
                <div className="sm:col-span-2">
                  <Button type="button" onClick={() => setStep(5)}>
                    Continue to publish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 5 ? (
            <form onSubmit={handlePublish} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Step 5 — Final check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">
                      Listing quality: {getQualityLabel(quality.rating)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{quality.message}</p>
                  </div>

                  {analysis ? <AiConfidenceBadge score={analysis.confidence} /> : null}

                  {similarListings.length > 0 ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                      <p className="font-medium">You may already have a similar active listing</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {similarListings.map((listing) => (
                          <li key={listing.id}>
                            <Link
                              href={`/dashboard/listings/${listing.id}`}
                              className="underline"
                            >
                              {listing.title}
                            </Link>{" "}
                            — {listing.material_name}
                          </li>
                        ))}
                      </ul>
                      <label className="mt-3 flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={ignoreDuplicate}
                          onCheckedChange={(checked) =>
                            setIgnoreDuplicate(checked === true)
                          }
                        />
                        Continue anyway and publish a new listing
                      </label>
                    </div>
                  ) : null}

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={publishNow}
                      onCheckedChange={(checked) => setPublishNow(checked === true)}
                    />
                    Publish immediately (make visible on marketplace)
                  </label>

                  <input type="hidden" name="title" value={form.title} />
                  <input type="hidden" name="description" value={form.description} />
                  <input type="hidden" name="categoryId" value={form.categoryId} />
                  <input type="hidden" name="materialName" value={form.materialName} />
                  <input type="hidden" name="materialGrade" value={form.materialGrade} />
                  <input type="hidden" name="quantity" value={form.quantity} />
                  <input type="hidden" name="quantityUnit" value={form.quantityUnit} />
                  <input type="hidden" name="condition" value={form.condition} />
                  <input
                    type="hidden"
                    name="contaminationLevel"
                    value={form.contaminationLevel}
                  />
                  <input type="hidden" name="moistureLevel" value={form.moistureLevel} />
                  <input type="hidden" name="qualityNotes" value={form.qualityNotes} />
                  <input type="hidden" name="askingPrice" value={form.askingPrice} />
                  <input type="hidden" name="currency" value={form.currency} />
                  <input type="hidden" name="priceUnit" value={form.priceUnit} />
                  <input
                    type="hidden"
                    name="negotiable"
                    value={form.negotiable ? "true" : "false"}
                  />
                  <input type="hidden" name="city" value={form.city} />
                  <input type="hidden" name="state" value={form.state} />
                  <input type="hidden" name="country" value={form.country} />
                  {form.recurring ? (
                    <input
                      type="hidden"
                      name="availabilityFrequency"
                      value={form.availabilityFrequency}
                    />
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="lg" disabled={pending || quality.missing.length > 0}>
                      {pending ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        "Confirm & publish listing"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(4)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
