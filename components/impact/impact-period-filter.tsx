"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { ImpactPeriod } from "@/lib/impact/constants"
import { IMPACT_PERIOD_LABELS } from "@/lib/impact/constants"
import { FormSelect } from "@/components/ui/form-select"

export function ImpactPeriodFilter({ current }: { current: ImpactPeriod }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all_time") {
      params.delete("period")
    } else {
      params.set("period", value)
    }
    router.push(`/dashboard/impact?${params.toString()}`)
  }

  return (
    <FormSelect
      id="impact-period"
      label="Reporting period"
      value={current}
      onChange={(event) => onChange(event.target.value)}
      options={Object.entries(IMPACT_PERIOD_LABELS).map(([value, label]) => ({
        value,
        label,
      }))}
    />
  )
}

export function ImpactReportLink({ period }: { period: ImpactPeriod }) {
  return (
    <Link
      href={`/dashboard/impact/report?period=${period}`}
      className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
      target="_blank"
      rel="noopener noreferrer"
    >
      Export Impact Report
    </Link>
  )
}
