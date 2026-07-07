type RateLimitEntry = {
  count: number
  resetAt: number
}

const attempts = new Map<string, RateLimitEntry>()

const MAX_ENTRIES = 10_000

function pruneExpired(now: number) {
  if (attempts.size <= MAX_ENTRIES) return

  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) {
      attempts.delete(key)
    }
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    }
  }

  entry.count += 1
  return { allowed: true, remaining: maxAttempts - entry.count }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
