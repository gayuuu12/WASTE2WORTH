import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "AI Analysis" },
  { id: 3, label: "Review" },
  { id: 4, label: "Price" },
  { id: 5, label: "Publish" },
] as const

export function AiProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step) => {
        const active = step.id === currentStep
        const done = step.id < currentStep
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium sm:text-sm",
              active && "bg-primary text-primary-foreground",
              done && !active && "bg-muted text-foreground",
              !active && !done && "bg-muted/50 text-muted-foreground",
            )}
          >
            {step.id}. {step.label}
          </li>
        )
      })}
    </ol>
  )
}
