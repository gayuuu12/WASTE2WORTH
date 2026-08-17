import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  href,
  hrefLabel,
  description,
  className,
}: {
  label: string
  value: string | number
  href?: string
  hrefLabel?: string
  description?: string
  className?: string
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold tabular tracking-tight">{value}</p>
        {href && hrefLabel ? (
          <Link
            href={href}
            className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {hrefLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}
