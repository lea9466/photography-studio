/**
 * Races a promise against a timeout, returning `fallback` if the promise
 * hasn't settled in time. Used in middleware.ts to keep a slow/degraded
 * Supabase response from hanging the whole Edge Function until Vercel's own
 * 25s middleware timeout kills it — a visitor should get a fast, safe
 * fallback response instead of a blank screen followed by a 504.
 *
 * Note: this only stops WAITING on the original promise, it doesn't cancel
 * it — any late resolution/rejection after the timeout is silently ignored
 * (via the empty .catch below), which is fine here since every call site
 * only reads the return value, never a side effect that must be undone.
 */
export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs)
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(fallback)
      })
  })
}
