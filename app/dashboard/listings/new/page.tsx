import Link from "next/link"
import { ListingForm } from "@/components/listings/listing-form"
import { buttonVariants } from "@/components/ui/button"
import { requireSupplierContext } from "@/lib/listings/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function NewListingPage() {
  const ctx = await requireSupplierContext()
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New listing</h1>
          <p className="text-muted-foreground">Publish surplus material to the marketplace</p>
        </div>
        <Link href="/dashboard/listings" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to listings
        </Link>
      </div>

      <ListingForm
        mode="create"
        categories={categories}
        companyId={ctx.company.id}
        defaultLocation={{
          city: ctx.company.city ?? undefined,
          state: ctx.company.state ?? undefined,
          country: ctx.company.country ?? undefined,
        }}
      />
    </div>
  )
}
