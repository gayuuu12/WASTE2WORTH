import Link from "next/link"
import { RequirementCard } from "@/components/requirements/requirement-card"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { canManageRequirements } from "@/lib/requirements/auth"
import { getCompanyRequirements } from "@/lib/requirements/auth"
import { cn } from "@/lib/utils"

export default async function RequirementsPage() {
  const ctx = await requireCompleteProfile()

  if (!canManageRequirements(ctx.company)) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">My requirements</h1>
        <p className="text-muted-foreground">
          Only buyer and dual-role companies can create material requirements.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to dashboard
        </Link>
      </div>
    )
  }

  const requirements = await getCompanyRequirements(ctx.company.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My requirements</h1>
          <p className="text-muted-foreground">Manage buyer material requirements</p>
        </div>
        <Link href="/dashboard/requirements/new" className={cn(buttonVariants())}>
          New requirement
        </Link>
      </div>

      {requirements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            Create a buyer requirement to discover matching materials.
          </p>
          <Link
            href="/dashboard/requirements/new"
            className={cn(buttonVariants(), "mt-4 inline-flex")}
          >
            Create requirement
          </Link>
        </div>
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
