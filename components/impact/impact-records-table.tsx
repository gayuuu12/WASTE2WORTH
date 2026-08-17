import Link from "next/link"
import type { ImpactRecordRow } from "@/lib/impact/metrics"
import { VERIFICATION_STATUS_LABELS } from "@/lib/impact/constants"
import { formatDate, formatMoney } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ImpactRecordsTable({ records }: { records: ImpactRecordRow[] }) {
  if (records.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Material Impact Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Material</th>
                <th className="py-2 pr-4 font-medium">Supplier</th>
                <th className="py-2 pr-4 font-medium">Buyer</th>
                <th className="py-2 pr-4 font-medium">Transferred</th>
                <th className="py-2 pr-4 font-medium">Value</th>
                <th className="py-2 pr-4 font-medium">Outcome</th>
                <th className="py-2 pr-4 font-medium">Recovered</th>
                <th className="py-2 font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">{formatDate(row.date)}</td>
                  <td className="py-3 pr-4">{row.material}</td>
                  <td className="py-3 pr-4">{row.supplier}</td>
                  <td className="py-3 pr-4">{row.buyer}</td>
                  <td className="py-3 pr-4">{row.transferredLabel}</td>
                  <td className="py-3 pr-4">{formatMoney(row.economicValue, row.currency)}</td>
                  <td className="py-3 pr-4">{row.outcomeLabel ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {row.recoveredLabel ?? "—"}
                    {row.recoveryPercent != null ? (
                      <span className="ml-1 text-muted-foreground">({row.recoveryPercent}%)</span>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <Link href={`/dashboard/impact/${row.id}`} className="text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {records.map((row) => (
            <div key={row.id} className="rounded-lg border border-border p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.material}</p>
                  <p className="text-muted-foreground">{formatDate(row.date)}</p>
                </div>
                {row.verificationStatus ? (
                  <Badge variant="outline">
                    {VERIFICATION_STATUS_LABELS[
                      row.verificationStatus as keyof typeof VERIFICATION_STATUS_LABELS
                    ] ?? row.verificationStatus}
                  </Badge>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-muted-foreground">Supplier</dt>
                  <dd>{row.supplier}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Buyer</dt>
                  <dd>{row.buyer}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Transferred</dt>
                  <dd>{row.transferredLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Value</dt>
                  <dd>{formatMoney(row.economicValue, row.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Outcome</dt>
                  <dd>{row.outcomeLabel ?? "Not reported"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Recovered</dt>
                  <dd>{row.recoveredLabel ?? "—"}</dd>
                </div>
              </dl>
              <Link
                href={`/dashboard/impact/${row.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
              >
                View journey
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
