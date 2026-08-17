import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ImpactMethodologyPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">How impact is calculated</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Transaction value</strong> comes from accepted
          offers recorded on completed Waste2Worth transactions. This is not supplier or buyer
          profit.
        </p>
        <p>
          <strong className="text-foreground">Material circulated</strong> sums completed
          transaction quantities. Kilograms and tonnes are normalized; litres, pallets, and other
          units are shown separately and never mixed into mass totals.
        </p>
        <p>
          <strong className="text-foreground">Reported recovery</strong> uses buyer-submitted
          material outcomes only. Transactions without an outcome are excluded from recovery rate
          calculations.
        </p>
        <p>
          <strong className="text-foreground">Environmental figures</strong> are not presented as
          measured facts in this phase. CO₂e estimates require documented emission factors and remain
          unavailable until a verified methodology is published.
        </p>
        <p>
          Data confidence labels: <strong className="text-foreground">Transaction verified</strong>{" "}
          (completed deal data), <strong className="text-foreground">Buyer reported</strong>{" "}
          (outcome submitted by buyer), <strong className="text-foreground">Supplier confirmed</strong>{" "}
          (supplier acknowledged outcome).
        </p>
      </CardContent>
    </Card>
  )
}
