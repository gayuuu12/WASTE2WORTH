import type { OfferStatus } from "@/lib/types"
import { titleCase } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

const STATUS_VARIANT: Record<
  OfferStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  countered: "outline",
  accepted: "default",
  rejected: "destructive",
  withdrawn: "outline",
  expired: "outline",
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{titleCase(status)}</Badge>
}
