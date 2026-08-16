"use client"

import { useRouter } from "next/navigation"
import type { FormEvent } from "react"
import type { ParsedMatchFilters } from "@/lib/matching/filters"
import { matchFiltersToSearchParams } from "@/lib/matching/filters"
import type { WasteCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function priceCompatibilityValue(filters: ParsedMatchFilters): string {
  if (filters.priceCompatibility === "compatible") return "compatible"
  if (filters.priceCompatibility === "incompatible") return "incompatible"
  return "any"
}

export function MatchFiltersForm({
  categories,
  filters,
}: {
  categories: WasteCategory[]
  filters: ParsedMatchFilters
}) {
  const router = useRouter()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const nextFilters: ParsedMatchFilters = {}

    const material = String(formData.get("material") ?? "").trim()
    if (material) nextFilters.material = material

    const category = String(formData.get("category") ?? "").trim()
    if (category) nextFilters.category = category

    const minScoreRaw = String(formData.get("minScore") ?? "").trim()
    if (minScoreRaw) {
      const minScore = Number(minScoreRaw)
      if (Number.isFinite(minScore) && minScore >= 0 && minScore <= 100) {
        nextFilters.minScore = minScore
      }
    }

    const maxDistanceRaw = String(formData.get("maxDistance") ?? "").trim()
    if (maxDistanceRaw) {
      const maxDistance = Number(maxDistanceRaw)
      if (Number.isFinite(maxDistance) && maxDistance >= 0) {
        nextFilters.maxDistance = maxDistance
      }
    }

    const priceCompatibility = String(formData.get("priceCompatibility") ?? "any")
    if (priceCompatibility === "compatible" || priceCompatibility === "incompatible") {
      nextFilters.priceCompatibility = priceCompatibility
    }

    const city = String(formData.get("city") ?? "").trim()
    if (city) nextFilters.city = city

    const state = String(formData.get("state") ?? "").trim()
    if (state) nextFilters.state = state

    const query = matchFiltersToSearchParams(nextFilters).toString()
    router.push(query ? `/dashboard/matches?${query}` : "/dashboard/matches")
  }

  function handleClear() {
    router.push("/dashboard/matches")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            name="material"
            defaultValue={filters.material ?? ""}
            placeholder="e.g. HDPE"
          />
        </div>

        <FormSelect
          id="category"
          name="category"
          label="Category"
          defaultValue={filters.category ?? ""}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((category) => ({ value: category.id, label: category.name })),
          ]}
        />

        <div className="space-y-2">
          <Label htmlFor="minScore">Minimum score</Label>
          <Input
            id="minScore"
            name="minScore"
            type="number"
            min="0"
            max="100"
            defaultValue={filters.minScore ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDistance">Max distance (km)</Label>
          <Input
            id="maxDistance"
            name="maxDistance"
            type="number"
            min="0"
            defaultValue={filters.maxDistance ?? ""}
          />
        </div>

        <FormSelect
          id="priceCompatibility"
          name="priceCompatibility"
          label="Price compatibility"
          defaultValue={priceCompatibilityValue(filters)}
          options={[
            { value: "any", label: "Any" },
            { value: "compatible", label: "Compatible only" },
            { value: "incompatible", label: "Incompatible only" },
          ]}
        />

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={filters.city ?? ""} placeholder="e.g. Chennai" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            defaultValue={filters.state ?? ""}
            placeholder="e.g. Tamil Nadu"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  )
}
