"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

/** Explicit hex series colors — do not use hsl(var(--*)) (theme vars are oklch). */
const MATERIAL_TREND_STROKE = "#34D399"
const MATERIAL_TREND_FILL = "url(#materialGradient)"
const ECONOMIC_BAR_FILL = "#22D3EE"
const DONUT_STROKE = "#102019"
const FALLBACK_COLOR = "#A3A3A3"

const CATEGORY_COLORS: Record<string, string> = {
  plastics: "#22D3EE",
  textiles: "#8B5CF6",
  metals: "#94A3B8",
  paper: "#F59E0B",
  "paper-cardboard": "#F59E0B",
  "paper & cardboard": "#F59E0B",
  organic: "#84CC16",
  "organic-agricultural": "#84CC16",
  "organic & agricultural": "#84CC16",
  wood: "#A16207",
  "wood-timber": "#A16207",
  "wood & timber": "#A16207",
  glass: "#38BDF8",
  rubber: "#F97316",
  "e-waste": "#EC4899",
  construction: "#64748B",
  "construction-demolition": "#64748B",
  "construction & demolition": "#64748B",
  chemical: "#EF4444",
  "chemical-solvents": "#EF4444",
  "chemical & solvents": "#EF4444",
  other: FALLBACK_COLOR,
}

const OUTCOME_COLORS = [
  "#34D399",
  "#22D3EE",
  "#8B5CF6",
  "#F59E0B",
  "#84CC16",
  "#F97316",
  "#EC4899",
  FALLBACK_COLOR,
]

function getCategoryColor(category: string): string {
  const lower = category.toLowerCase().trim()
  const slug = lower.replace(/\s*&\s*/g, "-").replace(/\s+/g, "-")

  if (CATEGORY_COLORS[slug]) return CATEGORY_COLORS[slug]
  if (CATEGORY_COLORS[lower]) return CATEGORY_COLORS[lower]

  if (lower.includes("plastic") || lower.includes("pet")) return CATEGORY_COLORS.plastics
  if (
    lower.includes("textile") ||
    lower.includes("fabric") ||
    lower.includes("cotton") ||
    lower.includes("yarn")
  ) {
    return CATEGORY_COLORS.textiles
  }
  if (lower.includes("metal")) return CATEGORY_COLORS.metals
  if (lower.includes("paper") || lower.includes("cardboard")) return CATEGORY_COLORS.paper
  if (lower.includes("organic") || lower.includes("agricultural")) return CATEGORY_COLORS.organic
  if (lower.includes("wood") || lower.includes("timber")) return CATEGORY_COLORS.wood
  if (lower.includes("glass")) return CATEGORY_COLORS.glass
  if (lower.includes("rubber")) return CATEGORY_COLORS.rubber
  if (lower.includes("e-waste") || lower.includes("electronic")) return CATEGORY_COLORS["e-waste"]
  if (lower.includes("construction") || lower.includes("demolition")) {
    return CATEGORY_COLORS.construction
  }
  if (lower.includes("chemical") || lower.includes("solvent")) return CATEGORY_COLORS.chemical

  return FALLBACK_COLOR
}

const AXIS_TICK = { fill: "#94A3B8", fontSize: 12 }
const GRID_STROKE = "#334155"

function MaterialTrendGradient() {
  return (
    <defs>
      <linearGradient id="materialGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#34D399" stopOpacity={0.03} />
      </linearGradient>
    </defs>
  )
}

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

  const singlePoint = data.length === 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Circular Material Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Completed mass-based transactions by month</p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {singlePoint ? (
            <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <MaterialTrendGradient />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip content={<ChartTooltipCard />} />
              <Line
                type="monotone"
                dataKey="massKg"
                stroke={MATERIAL_TREND_STROKE}
                strokeWidth={3}
                dot={{ fill: MATERIAL_TREND_STROKE, stroke: MATERIAL_TREND_STROKE, r: 7 }}
                activeDot={{ fill: MATERIAL_TREND_STROKE, stroke: "#ECFDF5", strokeWidth: 2, r: 8 }}
                name="Mass (kg)"
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <MaterialTrendGradient />
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip content={<ChartTooltipCard />} />
              <Area
                type="monotone"
                dataKey="massKg"
                stroke={MATERIAL_TREND_STROKE}
                strokeWidth={2}
                fill={MATERIAL_TREND_FILL}
                dot={{ fill: MATERIAL_TREND_STROKE, stroke: MATERIAL_TREND_STROKE, r: 4 }}
                activeDot={{ fill: MATERIAL_TREND_STROKE, stroke: "#ECFDF5", strokeWidth: 2, r: 6 }}
                name="Mass (kg)"
              />
            </AreaChart>
          )}
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

  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency

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
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="label" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} />
            <Tooltip
              formatter={(value) => [
                `${symbol}${Number(value ?? 0).toLocaleString("en-IN")}`,
                "Value",
              ]}
            />
            <Bar
              dataKey="value"
              fill={ECONOMIC_BAR_FILL}
              radius={[8, 8, 0, 0]}
              name="Value"
            />
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
              stroke={DONUT_STROKE}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={getCategoryColor(entry.category)}
                  stroke={DONUT_STROKE}
                  strokeWidth={2}
                />
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
        <ul className="mt-4 space-y-2 text-sm">
          {data.map((item) => {
            const color = getCategoryColor(item.category)
            return (
              <li key={item.category} className="flex items-center justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="truncate">{item.category}</span>
                </span>
                <span className="shrink-0 tabular text-muted-foreground">
                  {formatMassFromKg(item.massKg)} · {item.percentage}%
                </span>
              </li>
            )
          })}
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
        {data.map((item, index) => {
          const color = OUTCOME_COLORS[index % OUTCOME_COLORS.length] ?? FALLBACK_COLOR
          return (
            <div key={item.outcomeType} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  {item.label}
                </span>
                <span className="tabular text-muted-foreground">{item.percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
