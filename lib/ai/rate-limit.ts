const buckets = new Map<string, number[]>()

export function checkRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    return false
  }

  timestamps.push(now)
  buckets.set(key, timestamps)
  return true
}
