const RETRYABLE_FETCH_ERRORS = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
])

function isRetryableFetchError(error: unknown) {
  if (!(error instanceof Error)) return false
  if (error.message.includes('fetch failed')) return true

  const code = (error as Error & { cause?: { code?: string } }).cause?.code
  return code ? RETRYABLE_FETCH_ERRORS.has(code) : false
}

function retryDelayMs(attempt: number) {
  return 400 * 2 ** attempt
}

export function createFetchWithRetry(maxAttempts = 3) {
  return async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fetch(input, init)
      } catch (error) {
        lastError = error
        const canRetry = attempt < maxAttempts - 1 && isRetryableFetchError(error)
        if (!canRetry) break
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)))
      }
    }

    throw lastError
  }
}

export const fetchWithRetry = createFetchWithRetry()
