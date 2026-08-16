import type { ListingStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusVariant: Record<ListingStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  draft: "secondary",
  inactive: "outline",
  reserved: "outline",
  sold: "secondary",
  expired: "destructive",
}

export function ListingStatusBadge({
  status,
  className,
}: {
  status: ListingStatus
  className?: string
}) {
  return (
    <Badge variant={statusVariant[status]} className={cn(className)}>
      {titleCase(status)}
    </Badge>
  )
}
