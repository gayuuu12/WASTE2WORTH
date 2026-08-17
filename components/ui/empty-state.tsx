import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  children,
  className,
  icon,
}: {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  )
}
