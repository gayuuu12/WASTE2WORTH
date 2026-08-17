import { formatQuantity } from "@/lib/format"

/** Units that can be safely summed as mass (normalized to kg). */
export const MASS_UNITS = ["kg", "tonne"] as const

export type MassUnit = (typeof MASS_UNITS)[number]

export function isMassUnit(unit: string): unit is MassUnit {
  return (MASS_UNITS as readonly string[]).includes(unit)
}

export function massToKg(quantity: number, unit: string): number | null {
  if (unit === "kg") return quantity
  if (unit === "tonne") return quantity * 1000
  return null
}

export function formatMassFromKg(totalKg: number): string {
  if (totalKg <= 0) return "0 kg"
  if (totalKg >= 1000) {
    const tonnes = totalKg / 1000
    const rounded = tonnes >= 10 ? Math.round(tonnes * 10) / 10 : Math.round(tonnes * 100) / 100
    return `${rounded.toLocaleString("en-IN")} tonnes`
  }
  const rounded = totalKg >= 10 ? Math.round(totalKg) : Math.round(totalKg * 10) / 10
  return `${rounded.toLocaleString("en-IN")} kg`
}

export interface UnitQuantityTotal {
  unit: string
  total: number
}

export function sumMassQuantities(
  items: Array<{ quantity: number; unit: string }>,
): number {
  return items.reduce((sum, item) => {
    const kg = massToKg(item.quantity, item.unit)
    return kg != null ? sum + kg : sum
  }, 0)
}

export function sumNonMassQuantities(
  items: Array<{ quantity: number; unit: string }>,
): UnitQuantityTotal[] {
  const totals = new Map<string, number>()
  for (const item of items) {
    if (isMassUnit(item.unit)) continue
    totals.set(item.unit, (totals.get(item.unit) ?? 0) + item.quantity)
  }
  return [...totals.entries()].map(([unit, total]) => ({ unit, total }))
}

export function formatCirculatedSummary(
  massKg: number,
  otherTotals: UnitQuantityTotal[],
): string {
  const parts: string[] = []
  if (massKg > 0) {
    parts.push(formatMassFromKg(massKg))
  }
  for (const { unit, total } of otherTotals) {
    parts.push(formatQuantity(total, unit))
  }
  return parts.length > 0 ? parts.join(" + ") : "0 kg"
}
