import Link from "next/link"
import type { BuyerRequirement } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity } from "@/lib/format"
import { RequirementStatusBadge } from "@/components/requirements/requirement-status-badge"
import { RequirementRowActions } from "@/components/requirements/requirement-row-actions"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RequirementCard({ requirement }: { requirement: BuyerRequirement }) {
  const location = [
    requirement.preferred_city,
    requirement.preferred_state,
    requirement.preferred_country,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Card>
      <CardContent className="grid gap-4 py-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display font-semibold">{requirement.title}</h3>
            <RequirementStatusBadge status={requirement.status} />
          </div>
          <p className="text-sm text-muted-foreground">{requirement.material_name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{formatQuantity(requirement.quantity_needed, requirement.quantity_unit)}</span>
            <span>{formatMoney(requirement.max_price, requirement.currency)}</span>
            <span className="text-muted-foreground">{location || "—"}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {requirement.required_by ? (
              <span>Required by {formatDate(requirement.required_by)}</span>
            ) : null}
            <span>Created {formatDate(requirement.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-start gap-2 sm:flex-col">
          <Link
            href={`/dashboard/requirements/${requirement.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View
          </Link>
          <Link
            href={`/dashboard/requirements/${requirement.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <RequirementRowActions requirementId={requirement.id} status={requirement.status} />
        </div>
      </CardContent>
    </Card>
  )
}
