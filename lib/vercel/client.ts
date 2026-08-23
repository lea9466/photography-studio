import { VERCEL_API_BASE_URL, getVercelConfig, type VercelConfig } from './config'
import { VercelError } from './errors'

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 200

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type VercelErrorBody = { error?: { code?: string; message?: string } }

export class VercelClient {
  constructor(
    private readonly config: VercelConfig = getVercelConfig(),
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  private withTeamId(path: string): string {
    if (!this.config.teamId) return path
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}teamId=${encodeURIComponent(this.config.teamId)}`
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new VercelError('invalid_request')
    }

    const url = `${VERCEL_API_BASE_URL}${this.withTeamId(path)}`

    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const response = await fetch(url, {
          method,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiToken}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 429 || response.status >= 500) {
          const bodyText = await response.text().catch(() => '')
          lastError = new VercelError(
            response.status === 429 ? 'rate_limited' : 'provider_unavailable',
            { cause: `[${response.status}] ${method} ${path} ${bodyText}` }
          )
          if (attempt < MAX_ATTEMPTS) {
            await sleep(RETRY_BASE_DELAY_MS * attempt)
            continue
          }
          throw lastError
        }

        if (response.status === 404) {
          throw new VercelError('not_found')
        }

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as VercelErrorBody | null
          const code = errorBody?.error?.code
          if (code === 'domain_already_in_use' || code === 'forbidden') {
            throw new VercelError('domain_taken', { cause: errorBody?.error?.message })
          }
          throw new VercelError('provider_unavailable', {
            status: 422,
            cause: `[${response.status}] ${method} ${path} ${errorBody?.error?.message ?? ''}`,
          })
        }

        if (response.status === 204) return undefined as T
        return (await response.json()) as T
      } catch (error) {
        if (error instanceof VercelError) throw error
        lastError = error
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_DELAY_MS * attempt)
          continue
        }
        throw new VercelError('provider_unavailable', { cause: lastError })
      } finally {
        clearTimeout(timer)
      }
    }

    throw new VercelError('provider_unavailable', { cause: lastError })
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  get projectId(): string {
    return this.config.projectId
  }
}
