import type { RequirementStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/format"

const variants: Record<
  RequirementStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  paused: "outline",
  fulfilled: "secondary",
  closed: "destructive",
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return <Badge variant={variants[status]}>{titleCase(status)}</Badge>
}
