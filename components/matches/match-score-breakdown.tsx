import { getMatchTier } from "@/lib/matching/constants"
import type { MatchScoreBreakdown } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export function MatchTierBadge({ score }: { score: number }) {
  const tier = getMatchTier(score)
  return <Badge variant={tier.variant}>{tier.label}</Badge>
}

export function MatchScoreBreakdownView({
  breakdown,
  overall,
}: {
  breakdown: MatchScoreBreakdown | null
  overall: number
}) {
  if (!breakdown) {
    return <p className="text-sm text-muted-foreground">Score breakdown unavailable.</p>
  }

  const rows = [
    { label: "Material", value: breakdown.material },
    {
      label: "Quantity",
      value: breakdown.quantity,
      unavailable: breakdown.quantity == null,
    },
    {
      label: "Quality",
      value: breakdown.quality,
      unavailable: breakdown.quality == null,
    },
    {
      label: "Distance",
      value: breakdown.distance,
      unavailable: breakdown.distance_unavailable || breakdown.distance == null,
    },
    {
      label: "Price",
      value: breakdown.price,
      unavailable: breakdown.price_unavailable || breakdown.price == null,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Overall match score</p>
        <p className="font-display text-2xl font-bold tabular">{overall}%</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>{row.label}</span>
            <span className="font-medium tabular">
              {row.unavailable ? "Unavailable" : `${row.value}%`}
            </span>
          </div>
        ))}
      </div>
      {breakdown.distance_unavailable ? (
        <p className="text-xs text-muted-foreground">
          Distance score unavailable — straight-line distance requires coordinates on both the
          requirement and listing.
        </p>
      ) : null}
      {breakdown.price_unavailable ? (
        <p className="text-xs text-muted-foreground">
          Price score unavailable — currency or price/quantity units are not compatible.
        </p>
      ) : null}
    </div>
  )
}
