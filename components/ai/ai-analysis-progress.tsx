"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type AnalysisStage =
  | "preparing"
  | "sending"
  | "analyzing"
  | "preparing_suggestions"
  | "ready"

const STAGES: { id: AnalysisStage; label: string }[] = [
  { id: "preparing", label: "Preparing image" },
  { id: "sending", label: "Sending securely" },
  { id: "analyzing", label: "Analyzing material" },
  { id: "preparing_suggestions", label: "Preparing suggestions" },
  { id: "ready", label: "Ready for review" },
]

const STAGE_ORDER: AnalysisStage[] = STAGES.map((stage) => stage.id)

function stageIndex(stage: AnalysisStage) {
  return STAGE_ORDER.indexOf(stage)
}

export function AiAnalysisProgress({ stage }: { stage: AnalysisStage }) {
  const currentIndex = stageIndex(stage)

  return (
    <ol className="mx-auto w-full max-w-md space-y-3 text-left" aria-live="polite">
      {STAGES.map((item, index) => {
        const done = index < currentIndex || stage === "ready"
        const active = item.id === stage
        const pending = index > currentIndex && stage !== "ready"

        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
              active && "border-primary/40 bg-primary/5",
              done && !active && "border-border bg-muted/30 text-muted-foreground",
              pending && "border-border/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border",
                done && "border-primary bg-primary text-primary-foreground",
                active && !done && "border-primary text-primary",
                pending && "border-border",
              )}
              aria-hidden
            >
              {done ? (
                <Check className="size-4" />
              ) : active ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                index + 1
              )}
            </span>
            <span className={cn(active && "font-medium text-foreground")}>{item.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
