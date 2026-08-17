"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CategoryBreakdownItem, ImpactTrendPoint, OutcomeBreakdownItem } from "@/lib/impact/metrics"
import { formatMassFromKg } from "@/lib/impact/units"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 142 71% 45%))",
  "hsl(var(--chart-3, 221 83% 53%))",
  "hsl(var(--chart-4, 47 96% 53%))",
  "hsl(var(--chart-5, 280 65% 60%))",
  "hsl(var(--muted-foreground))",
]

function ChartTooltipCard({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: ImpactTrendPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{label ?? point?.label}</p>
      {point ? (
        <>
          <p>Material circulated: {formatMassFromKg(point.massKg)}</p>
          <p>Transactions: {point.transactionCount}</p>
        </>
      ) : null}
    </div>
  )
}

export function CircularMaterialTrendChart({ data }: { data: ImpactTrendPoint[] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Circular Material Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Completed mass-based transactions by month</p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltipCard />} />
            <Bar dataKey="massKg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Mass (kg)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function EconomicValueTrendChart({
  data,
  currency,
}: {
  data: ImpactTrendPoint[]
  currency: string
}) {
  if (data.length === 0) return null

  const chartData = data.map((point) => ({
    label: point.label,
    value: point.valueByCurrency[currency] ?? 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Economic Value Created</CardTitle>
        <p className="text-sm text-muted-foreground">
          Transaction value through Waste2Worth ({currency})
        </p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function MaterialsCirculatedChart({ data }: { data: CategoryBreakdownItem[] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Materials Circulated</CardTitle>
        <p className="text-sm text-muted-foreground">Mass-based category distribution</p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="massKg"
              nameKey="category"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const numeric = typeof value === "number" ? value : Number(value ?? 0)
                const payload = item?.payload as CategoryBreakdownItem | undefined
                return [
                  `${formatMassFromKg(numeric)} (${payload?.percentage ?? 0}%)`,
                  payload?.category ?? "Category",
                ]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="mt-4 space-y-1 text-sm">
          {data.map((item) => (
            <li key={item.category} className="flex justify-between gap-4">
              <span>{item.category}</span>
              <span className="tabular text-muted-foreground">
                {formatMassFromKg(item.massKg)} · {item.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function OutcomeBreakdownChart({ data }: { data: OutcomeBreakdownItem[] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Where Materials Went</CardTitle>
        <p className="text-sm text-muted-foreground">Based on reported outcomes only</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.outcomeType} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="tabular text-muted-foreground">{item.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
