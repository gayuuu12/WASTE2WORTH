import type { ImpactPeriod } from "@/lib/impact/constants"

export function getImpactPeriodStart(period: ImpactPeriod, now = new Date()): Date | null {
  if (period === "all_time") return null

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (period) {
    case "this_month":
      start.setDate(1)
      return start
    case "last_3_months":
      start.setMonth(start.getMonth() - 3)
      return start
    case "last_6_months":
      start.setMonth(start.getMonth() - 6)
      return start
    case "this_year":
      start.setMonth(0, 1)
      return start
    default:
      return null
  }
}

export function transactionInPeriod(
  updatedAt: string,
  period: ImpactPeriod,
  now = new Date(),
): boolean {
  const start = getImpactPeriodStart(period, now)
  if (!start) return true
  return new Date(updatedAt) >= start
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  })
}
