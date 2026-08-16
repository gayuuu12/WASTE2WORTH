import Link from "next/link"
import type { MarketplaceFilters } from "@/lib/validations/listings"
import type { WasteCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MarketplaceFiltersForm({
  categories,
  filters,
}: {
  categories: WasteCategory[]
  filters: MarketplaceFilters
}) {
  return (
    <form method="get" className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2 md:col-span-2 xl:col-span-3">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={filters.q ?? ""} placeholder="Search listings…" />
        </div>

        <FormSelect
          id="category"
          name="category"
          label="Category"
          placeholder="All categories"
          defaultValue={filters.category ?? ""}
          options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />

        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input id="material" name="material" defaultValue={filters.material ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={filters.city ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={filters.state ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minQuantity">Min quantity</Label>
          <Input id="minQuantity" name="minQuantity" type="number" min="0" defaultValue={filters.minQuantity ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPrice">Max price</Label>
          <Input id="maxPrice" name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice ?? ""} />
        </div>

        <FormSelect
          id="recurring"
          name="recurring"
          label="Recurring"
          placeholder="Any"
          defaultValue={filters.recurring ?? ""}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Recurring only" },
            { value: "false", label: "One-time only" },
          ]}
        />

        <FormSelect
          id="verified"
          name="verified"
          label="Supplier verification"
          placeholder="Any"
          defaultValue={filters.verified ?? ""}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Verified only" },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Apply filters</Button>
        <Link href="/marketplace" className="inline-flex h-8 items-center px-2.5 text-sm text-muted-foreground hover:text-foreground">
          Clear
        </Link>
      </div>
    </form>
  )
}
