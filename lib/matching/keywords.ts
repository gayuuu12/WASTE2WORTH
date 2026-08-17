/** Shared keyword tokenization for material / marketplace search matching. */

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
])

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

/** Meaningful tokens for partial material matching (min length 2). */
export function tokenizeMaterialText(value: string | null | undefined): string[] {
  const normalized = normalizeSearchText(value)
  if (!normalized) return []

  const tokens = normalized
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))

  return [...new Set(tokens)]
}

export function listingSearchHaystack(fields: {
  materialName?: string | null
  title?: string | null
  description?: string | null
  categoryName?: string | null
  city?: string | null
  state?: string | null
  companyName?: string | null
}): string {
  return [
    fields.materialName,
    fields.title,
    fields.description,
    fields.categoryName,
    fields.city,
    fields.state,
    fields.companyName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function tokenMatchesHaystack(token: string, haystack: string, haystackTokens: string[]): boolean {
  if (haystack.includes(token)) return true
  return haystackTokens.some(
    (candidate) => candidate === token || candidate.includes(token) || token.includes(candidate),
  )
}

export function scoreKeywordOverlap(
  query: string | null | undefined,
  haystackText: string,
): { score: number; matchedCount: number; queryCount: number } {
  const queryTokens = tokenizeMaterialText(query)
  if (queryTokens.length === 0) {
    return { score: 0, matchedCount: 0, queryCount: 0 }
  }

  const haystack = normalizeSearchText(haystackText)
  const haystackTokens = tokenizeMaterialText(haystack)

  const matchedCount = queryTokens.filter((token) =>
    tokenMatchesHaystack(token, haystack, haystackTokens),
  ).length
  const queryCount = queryTokens.length
  const ratio = matchedCount / queryCount

  if (ratio === 1) {
    return { score: queryCount >= 2 ? 95 : 90, matchedCount, queryCount }
  }

  if (matchedCount >= 1) {
    const weakScore = Math.round(30 + ratio * 35)
    return { score: Math.min(75, weakScore), matchedCount, queryCount }
  }

  return { score: 0, matchedCount: 0, queryCount }
}

export function hasAnyKeywordMatch(
  query: string | null | undefined,
  haystackText: string,
): boolean {
  return scoreKeywordOverlap(query, haystackText).matchedCount > 0
}

export function combineSearchQueries(...parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
}
