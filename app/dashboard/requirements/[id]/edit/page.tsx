import Link from "next/link"
import { RequirementForm } from "@/components/requirements/requirement-form"
import { buttonVariants } from "@/components/ui/button"
import { requireBuyerContext, requireOwnedRequirement } from "@/lib/requirements/auth"
import { getWasteCategories } from "@/lib/listings/categories"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export default async function EditRequirementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireBuyerContext()
  const requirement = await requireOwnedRequirement(id, ctx.company.id)
  const supabase = await createClient()
  const categories = await getWasteCategories(supabase)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Edit requirement</h1>
          <p className="text-muted-foreground">{requirement.title}</p>
        </div>
        <Link
          href={`/dashboard/requirements/${requirement.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </Link>
      </div>

      <RequirementForm mode="edit" requirement={requirement} categories={categories} />
    </div>
  )
}
