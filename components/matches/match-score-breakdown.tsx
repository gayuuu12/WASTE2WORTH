import { getMatchTier } from "@/lib/matching/constants"
import type { MatchScoreBreakdown } from "@/lib/types"
import { ScoreBar } from "@/components/ui/score-bar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function MatchTierBadge({ score }: { score: number }) {
  const tier = getMatchTier(score)
  return (
    <Badge variant={tier.variant} className="text-xs">
      {score}% · {tier.label}
    </Badge>
  )
}

export function MatchScoreBreakdownView({
  breakdown,
  overall,
  compact = false,
}: {
  breakdown: MatchScoreBreakdown | null
  overall: number
  compact?: boolean
}) {
  if (!breakdown) {
    return <p className="text-sm text-muted-foreground">Score breakdown unavailable.</p>
  }

  const rows = [
    { label: "Material", value: breakdown.material },
    {
      label: "Quantity",
      value: breakdown.quantity,
      notSpecified: breakdown.quantity_not_specified,
      unavailable: breakdown.quantity_unavailable,
    },
    {
      label: "Quality",
      value: breakdown.quality,
      notSpecified: breakdown.quality_not_specified,
    },
    {
      label: "Price",
      value: breakdown.price,
      notSpecified: breakdown.price_not_specified,
      unavailable: breakdown.price_unavailable,
    },
    {
      label: "Distance",
      value: breakdown.distance,
      unavailable: breakdown.distance_unavailable,
    },
  ]

  const tier = getMatchTier(overall)

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Match score
          </p>
          <p className="font-display text-3xl font-bold tabular">{overall}%</p>
        </div>
        <Badge variant={tier.variant}>{tier.label}</Badge>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <ScoreBar
            key={row.label}
            label={row.label}
            value={row.value}
            notSpecified={row.notSpecified}
            unavailable={row.unavailable}
          />
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
      {breakdown.quality_not_specified ? (
        <p className="text-xs text-muted-foreground">
          Quality was not included in the overall score because no preferred quality was specified.
        </p>
      ) : null}
    </div>
  )
}
