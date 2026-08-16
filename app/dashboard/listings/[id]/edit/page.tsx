import Link from "next/link"
import { ListingForm } from "@/components/listings/listing-form"
import { buttonVariants } from "@/components/ui/button"
import { requireSupplierContext, requireOwnedListing } from "@/lib/listings/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireSupplierContext()
  const listing = await requireOwnedListing(id, ctx.company.id)
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Edit listing</h1>
          <p className="text-muted-foreground">{listing.title}</p>
        </div>
        <Link
          href={`/dashboard/listings/${listing.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </Link>
      </div>

      <ListingForm
        mode="edit"
        listing={listing}
        categories={categories}
        companyId={ctx.company.id}
      />
    </div>
  )
}
