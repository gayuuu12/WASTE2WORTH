import Link from "next/link"
import type { BuyerRequirement } from "@/lib/types"
import { formatDate, formatMoney, formatQuantity, titleCase } from "@/lib/format"
import { RequirementStatusBadge } from "@/components/requirements/requirement-status-badge"
import { RequirementRowActions } from "@/components/requirements/requirement-row-actions"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function RequirementDetailView({ requirement }: { requirement: BuyerRequirement }) {
  const location = [
    requirement.preferred_city,
    requirement.preferred_state,
    requirement.preferred_country,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">{requirement.title}</h1>
            <RequirementStatusBadge status={requirement.status} />
          </div>
          {requirement.category?.name ? (
            <Badge variant="secondary">{requirement.category.name}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/requirements/${requirement.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
          <RequirementRowActions requirementId={requirement.id} status={requirement.status} />
        </div>
      </div>

      {requirement.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
            {requirement.description}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Material:</span> {requirement.material_name}
            </p>
            {requirement.desired_grade ? (
              <p>
                <span className="text-muted-foreground">Grade:</span> {requirement.desired_grade}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Quantity:</span>{" "}
              {formatQuantity(requirement.quantity_needed, requirement.quantity_unit)}
            </p>
            {requirement.minimum_acceptable_quantity ? (
              <p>
                <span className="text-muted-foreground">Minimum acceptable:</span>{" "}
                {formatQuantity(
                  requirement.minimum_acceptable_quantity,
                  requirement.quantity_unit,
                )}
              </p>
            ) : null}
            {requirement.preferred_quality ? (
              <p>
                <span className="text-muted-foreground">Preferred quality:</span>{" "}
                {titleCase(requirement.preferred_quality)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget & location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Max price:</span>{" "}
              {formatMoney(requirement.max_price, requirement.currency)}
            </p>
            {requirement.max_distance_km ? (
              <p>
                <span className="text-muted-foreground">Max distance:</span>{" "}
                {requirement.max_distance_km} km
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Location:</span> {location || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Recurring:</span>{" "}
              {requirement.recurring ? "Yes" : "No"}
            </p>
            {requirement.required_by ? (
              <p>
                <span className="text-muted-foreground">Required by:</span>{" "}
                {formatDate(requirement.required_by)}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Created:</span>{" "}
              {formatDate(requirement.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Link
        href="/dashboard/matches"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        View matches for this requirement
      </Link>
    </div>
  )
}
