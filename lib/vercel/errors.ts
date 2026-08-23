export type VercelErrorCode =
  | 'not_configured'
  | 'invalid_request'
  | 'domain_taken'
  | 'not_found'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'internal_error'

const SAFE_MESSAGES: Record<VercelErrorCode, string> = {
  not_configured: 'חיבור דומיינים אישיים עדיין אינו מוגדר במערכת.',
  invalid_request: 'הבקשה אינה תקינה.',
  domain_taken: 'הדומיין הזה כבר מחובר לפרויקט אחר.',
  not_found: 'הדומיין לא נמצא.',
  rate_limited: 'יותר מדי ניסיונות. נסי שוב מאוחר יותר.',
  provider_unavailable: 'שירות הדומיינים אינו זמין כרגע. נסי שוב מאוחר יותר.',
  internal_error: 'לא הצלחנו להשלים את הפעולה.',
}

export class VercelError extends Error {
  readonly code: VercelErrorCode
  readonly status: number

  constructor(code: VercelErrorCode, options?: { status?: number; cause?: unknown }) {
    super(SAFE_MESSAGES[code], { cause: options?.cause })
    this.name = 'VercelError'
    this.code = code
    this.status = options?.status ?? defaultStatus(code)
  }
}

function defaultStatus(code: VercelErrorCode) {
  if (code === 'invalid_request' || code === 'domain_taken') return 400
  if (code === 'not_found') return 404
  if (code === 'rate_limited') return 429
  if (code === 'not_configured') return 503
  if (code === 'provider_unavailable') return 422
  return 500
}
