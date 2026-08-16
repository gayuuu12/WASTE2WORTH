import Link from "next/link"
import { RequirementDetailView } from "@/components/requirements/requirement-detail-view"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { requireOwnedRequirement } from "@/lib/requirements/auth"
import { cn } from "@/lib/utils"

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const requirement = await requireOwnedRequirement(id, ctx.company.id)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/requirements"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to requirements
      </Link>
      <RequirementDetailView requirement={requirement} />
    </div>
  )
}
