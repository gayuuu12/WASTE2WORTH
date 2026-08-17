export type ConfidenceLevel = "high" | "medium" | "low"

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "high"
  if (score >= 60) return "medium"
  return "low"
}

export function getConfidenceLabel(level: ConfidenceLevel) {
  switch (level) {
    case "high":
      return "High confidence"
    case "medium":
      return "Medium confidence"
    case "low":
      return "Low confidence"
  }
}

export function getConfidenceDescription(level: ConfidenceLevel) {
  switch (level) {
    case "high":
      return "AI is fairly confident about this material identification. Please still review before publishing."
    case "medium":
      return "AI has moderate confidence. Please verify the suggested details."
    case "low":
      return "AI is not confident. Please verify carefully or switch to Manual Listing."
  }
}
