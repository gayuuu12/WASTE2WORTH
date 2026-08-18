import Link from "next/link"
import { RequirementDetailView } from "@/components/requirements/requirement-detail-view"
import { EmbeddedMatchesSection } from "@/components/matches/embedded-matches-section"
import { buttonVariants } from "@/components/ui/button"
import { requireCompleteProfile } from "@/lib/auth"
import { generateMatchesForRequirement } from "@/lib/matching/engine"
import { getMatchesForRequirement } from "@/lib/matching/queries"
import { requireOwnedRequirement } from "@/lib/requirements/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireCompleteProfile()
  const supabase = await createClient()
  const requirement = await requireOwnedRequirement(id, ctx.company.id)

  if (requirement.status === "active") {
    await generateMatchesForRequirement(supabase, requirement.id)
  }

  const matches = await getMatchesForRequirement(supabase, requirement.id, ctx.company.id)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/requirements"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to My Requirements
      </Link>
      <RequirementDetailView requirement={requirement} />

      {requirement.status === "active" ? (
        <EmbeddedMatchesSection
          title="Matching Suppliers"
          matches={matches}
          perspective="buyer"
          emptyMessage="No matching suppliers yet. New listings are checked automatically when you open this requirement."
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Activate this requirement to see matching supplier listings.
        </p>
      )}
    </div>
  )
}
