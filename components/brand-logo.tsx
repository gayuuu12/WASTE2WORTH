import { cn } from "@/lib/utils"
import { Recycle } from "lucide-react"

export function BrandLogo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const box = size === "sm" ? "size-7" : size === "lg" ? "size-11" : "size-9"
  const icon = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg"

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-md bg-primary text-primary-foreground",
          box,
        )}
      >
        <Recycle className={icon} strokeWidth={2.25} />
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", text)}>
          Waste2Worth
        </span>
      )}
    </div>
  )
}
