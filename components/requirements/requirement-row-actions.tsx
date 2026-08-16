"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteRequirementAction,
  toggleRequirementStatusAction,
} from "@/lib/actions/requirements"
import type { RequirementStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { titleCase } from "@/lib/format"

export function RequirementRowActions({
  requirementId,
  status,
}: {
  requirementId: string
  status: RequirementStatus
}) {
  const [pending, startTransition] = useTransition()

  const canToggle = status === "active" || status === "paused"
  const toggleLabel = status === "active" ? "Deactivate" : "Activate"

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
              const result = await toggleRequirementStatusAction(requirementId)
              if (result.error) toast.error(result.error)
              else toast.success(`Requirement ${titleCase(result.status ?? "updated")}`)
            })
          }}
        >
          {pending ? <Loader2 className="animate-spin" /> : toggleLabel}
        </Button>
      ) : null}

      {status === "paused" ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this requirement permanently?")) return
            startTransition(async () => {
              const result = await deleteRequirementAction(requirementId)
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
