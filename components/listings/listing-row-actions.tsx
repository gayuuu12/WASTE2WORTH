"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteListingAction,
  toggleListingStatusAction,
} from "@/lib/actions/listings"
import type { ListingStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { titleCase } from "@/lib/format"

export function ListingRowActions({
  listingId,
  status,
}: {
  listingId: string
  status: ListingStatus
}) {
  const [pending, startTransition] = useTransition()

  const canToggle = ["active", "inactive", "draft"].includes(status)
  const toggleLabel =
    status === "active" ? "Deactivate" : status === "draft" ? "Publish" : "Activate"

  return (
    <div className="flex flex-wrap gap-2">
      {canToggle ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await toggleListingStatusAction(listingId)
              if (result.error) toast.error(result.error)
              else toast.success(`Listing ${result.status === "active" ? "activated" : titleCase(result.status ?? "updated")}`)
            })
          }}
        >
          {pending ? <Loader2 className="animate-spin" /> : toggleLabel}
        </Button>
      ) : null}

      {status === "draft" || status === "inactive" ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this listing permanently?")) return
            startTransition(async () => {
              const result = await deleteListingAction(listingId)
              if (result?.error) toast.error(result.error)
            })
          }}
        >
          Delete
        </Button>
      ) : null}
    </div>
  )
}
