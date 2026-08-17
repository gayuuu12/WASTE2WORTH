import type { WasteAnalysisResult } from "@/lib/validations/ai"
import { AiConfidenceBadge } from "@/components/ai/ai-confidence-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ACTION_LABELS: Record<WasteAnalysisResult["recommendation"]["action"], string> = {
  sell_directly: "Sell directly",
  reuse: "Reuse",
  recycle: "Recycle",
  further_inspection: "Further inspection required",
}

export function AiAnalysisPanel({ analysis }: { analysis: WasteAnalysisResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What AI detected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-lg font-semibold">{analysis.material_name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              Category: {analysis.category.replace(/-/g, " ")}
            </p>
          </div>
          <AiConfidenceBadge score={analysis.confidence} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why AI thinks this</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {analysis.explanation.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div className="rounded-md bg-muted/60 p-3 text-sm">
            <p className="font-medium">Uncertainty</p>
            <p className="text-muted-foreground">{analysis.uncertainty}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What can this material become?</CardTitle>
          <p className="text-xs text-muted-foreground">AI suggested potential uses</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.possible_uses.map((item) => (
            <div key={item.use} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{item.use}</p>
              <p className="mt-1 text-muted-foreground">{item.reason}</p>
              <p className="mt-2 text-xs">
                Suitability: <span className="capitalize">{item.suitability}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Limitations: {item.limitations}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">
            {ACTION_LABELS[analysis.recommendation.action]}
          </p>
          <p className="text-muted-foreground">{analysis.recommendation.summary}</p>
        </CardContent>
      </Card>
    </div>
  )
}
