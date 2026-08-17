import type { ImpactJourneyItem } from "@/lib/impact/metrics"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown } from "lucide-react"

export function MaterialJourneySection({ journeys }: { journeys: ImpactJourneyItem[] }) {
  if (journeys.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Material Journey</CardTitle>
        <p className="text-sm text-muted-foreground">
          Supplier → material → buyer → reported outcome
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {journeys.map((journey) => (
          <Link
            key={journey.transactionId}
            href={`/dashboard/impact/${journey.transactionId}`}
            className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
          >
            <div className="space-y-2 text-sm">
              <p className="font-medium">{journey.supplierName}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ArrowDown className="size-4 shrink-0" aria-hidden />
                <span>
                  {journey.quantityLabel} {journey.materialName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ArrowDown className="size-4 shrink-0" aria-hidden />
                <span>{journey.buyerName}</span>
              </div>
              {journey.outcomeLabel ? (
                <div className="flex items-center gap-2 font-medium text-primary">
                  <ArrowDown className="size-4 shrink-0" aria-hidden />
                  <span>
                    {journey.outcomeLabel}
                    {journey.resultingProduct ? ` · ${journey.resultingProduct}` : ""}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Outcome not yet reported</p>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
