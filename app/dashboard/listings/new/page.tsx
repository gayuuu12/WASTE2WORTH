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
          <h1 className="font-display text-3xl font-bold tracking-tight">Manual Listing</h1>
          <p className="text-muted-foreground">
            Publish surplus material to the marketplace using the original form
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/listings/ai-new" className={cn(buttonVariants({ variant: "outline" }))}>
            AI Smart Listing
          </Link>
          <Link href="/dashboard/listings" className={cn(buttonVariants({ variant: "ghost" }))}>
            Back to listings
          </Link>
        </div>
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
