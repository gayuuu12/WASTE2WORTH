import { cn } from "@/lib/utils"

export function ScoreBar({
  label,
  value,
  unavailable = false,
  notSpecified = false,
  className,
}: {
  label: string
  value: number | null
  unavailable?: boolean
  notSpecified?: boolean
  className?: string
}) {
  const display = notSpecified
    ? "Not specified"
    : unavailable || value == null
      ? "Unavailable"
      : `${value}%`
  const width =
    notSpecified || unavailable || value == null ? 0 : Math.min(100, Math.max(0, value))

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular">{display}</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={notSpecified || unavailable || value == null ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} match score`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            notSpecified || unavailable || value == null ? "w-0" : "bg-primary",
          )}
          style={{ width: notSpecified || unavailable || value == null ? undefined : `${width}%` }}
        />
      </div>
    </div>
  )
}
