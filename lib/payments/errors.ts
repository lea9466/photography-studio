export type PaymentErrorCode =
  | 'authentication_required'
  | 'invalid_request'
  | 'plan_not_found'
  | 'subscription_not_found'
  | 'forbidden'
  | 'provider_not_configured'
  | 'provider_unavailable'
  | 'invalid_webhook'
  | 'verification_failed'
  | 'billing_not_initialized'
  | 'subscription_not_active'
  | 'internal_error'

const SAFE_MESSAGES: Record<PaymentErrorCode, string> = {
  authentication_required: 'יש להתחבר מחדש.',
  invalid_request: 'הבקשה אינה תקינה.',
  plan_not_found: 'מסלול המינוי אינו זמין.',
  subscription_not_found: 'לא נמצא מינוי פעיל.',
  forbidden: 'אין הרשאה לבצע את הפעולה.',
  provider_not_configured: 'שירות התשלומים עדיין אינו מוגדר.',
  provider_unavailable: 'שירות התשלומים אינו זמין כרגע. נסי שוב מאוחר יותר.',
  invalid_webhook: 'Webhook verification failed.',
  verification_failed: 'אימות התשלום נכשל.',
  billing_not_initialized: 'תשתית החיוב טרם הופעלה.',
  subscription_not_active: 'המנוי עדיין לא פעיל. השלימי תשלום תחילה כדי לעדכן או לבטל.',
  internal_error: 'לא הצלחנו להשלים את הפעולה.',
}

export class PaymentError extends Error {
  readonly code: PaymentErrorCode
  readonly status: number

  constructor(code: PaymentErrorCode, options?: { status?: number; cause?: unknown }) {
    super(SAFE_MESSAGES[code], { cause: options?.cause })
    this.name = 'PaymentError'
    this.code = code
    this.status = options?.status ?? defaultStatus(code)
  }
}

function defaultStatus(code: PaymentErrorCode) {
  if (code === 'authentication_required') return 401
  if (code === 'forbidden') return 403
  if (code === 'plan_not_found' || code === 'subscription_not_found') return 404
  if (
    code === 'invalid_request' ||
    code === 'invalid_webhook' ||
    code === 'verification_failed'
  ) {
    return 400
  }
  if (code === 'provider_not_configured' || code === 'billing_not_initialized') return 503
  if (code === 'subscription_not_active') return 409
  if (code === 'provider_unavailable') return 502
  return 500
}

export function toPaymentError(error: unknown): PaymentError {
  if (error instanceof PaymentError) return error
  return new PaymentError('internal_error', { cause: error })
}

export function isMissingBillingSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const value = error as { code?: string; message?: string }
  return (
    value.code === '42P01' ||
    value.code === 'PGRST205' ||
    value.message?.includes('subscription_plans') === true ||
    value.message?.includes('subscriptions') === true
  )
}
