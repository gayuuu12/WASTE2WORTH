import Link from "next/link"
import { RequirementForm } from "@/components/requirements/requirement-form"
import { buttonVariants } from "@/components/ui/button"
import { requireBuyerContext } from "@/lib/requirements/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function NewRequirementPage() {
  const ctx = await requireBuyerContext()
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New requirement</h1>
          <p className="text-muted-foreground">Describe the material your company needs</p>
        </div>
        <Link href="/dashboard/requirements" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to requirements
        </Link>
      </div>

      <RequirementForm
        mode="create"
        categories={categories}
        defaultLocation={{
          city: ctx.company.city ?? undefined,
          state: ctx.company.state ?? undefined,
          country: ctx.company.country ?? undefined,
        }}
      />
    </div>
  )
}
