import { Badge } from "@/components/ui/badge"
import {
  getConfidenceDescription,
  getConfidenceLabel,
  getConfidenceLevel,
  type ConfidenceLevel,
} from "@/lib/ai/confidence"
import { cn } from "@/lib/utils"

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  medium: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  low: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
}

export function AiConfidenceBadge({ score }: { score: number }) {
  const level = getConfidenceLevel(score)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("text-sm", LEVEL_STYLES[level])}>
          {getConfidenceLabel(level)}
        </Badge>
        <span className="text-sm text-muted-foreground">{Math.round(score)}%</span>
      </div>
      <p className="text-sm text-muted-foreground">{getConfidenceDescription(level)}</p>
    </div>
  )
}

export function AiSuggestedBadge() {
  return (
    <Badge variant="outline" className="text-xs font-normal">
      AI suggested
    </Badge>
  )
}
