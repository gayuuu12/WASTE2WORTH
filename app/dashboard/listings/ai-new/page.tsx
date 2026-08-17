import Link from "next/link"
import { AiListingWizard } from "@/components/ai/ai-listing-wizard"
import { buttonVariants } from "@/components/ui/button"
import { isAiConfigured } from "@/lib/ai/config"
import { requireSupplierContext } from "@/lib/listings/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import { getCompanyListings } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function AiNewListingPage() {
  const ctx = await requireSupplierContext()
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)
  const existingListings = await getCompanyListings(supabase, ctx.company.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">AI Smart Listing</h1>
          <p className="max-w-2xl text-muted-foreground">
            Upload your waste image and let AI prepare your listing. You only need to provide an
            image and quantity. AI will help identify the material and prepare the remaining
            details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/listings/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Manual Listing
          </Link>
          <Link href="/dashboard/listings" className={cn(buttonVariants({ variant: "ghost" }))}>
            Back to listings
          </Link>
        </div>
      </div>

      <AiListingWizard
        categories={categories}
        companyId={ctx.company.id}
        existingListings={existingListings}
        defaultLocation={{
          city: ctx.company.city ?? undefined,
          state: ctx.company.state ?? undefined,
          country: ctx.company.country ?? undefined,
        }}
        aiAvailable={isAiConfigured()}
      />
    </div>
  )
}
