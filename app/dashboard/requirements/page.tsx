import Link from "next/link"
import { RequirementCard } from "@/components/requirements/requirement-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { canManageRequirements } from "@/lib/requirements/auth"
import { getCompanyRequirements } from "@/lib/requirements/auth"
import { cn } from "@/lib/utils"
import { ClipboardList, Plus } from "lucide-react"

export default async function RequirementsPage() {
  const ctx = await requireCompleteProfile()

  if (!canManageRequirements(ctx.company)) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Requirements"
          description="Only buyer and dual-role companies can create material requirements."
        />
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to dashboard
        </Link>
      </div>
    )
  }

  const requirements = await getCompanyRequirements(ctx.company.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requirements"
        description="Tell Waste2Worth what material you need and discover matching listings."
      >
        <Link href="/dashboard/requirements/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 size-4" aria-hidden />
          Add requirement
        </Link>
      </PageHeader>

      {requirements.length === 0 ? (
        <EmptyState
          title="No requirements yet"
          description="Tell Waste2Worth what material you need."
          icon={<ClipboardList className="size-5" aria-hidden />}
        >
          <Link href="/dashboard/requirements/new" className={cn(buttonVariants())}>
            Add requirement
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <RequirementCard key={requirement.id} requirement={requirement} />
          ))}
        </div>
      )}
    </div>
  )
}
