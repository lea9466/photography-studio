/** Safe logging helpers for email stubs — never log secrets. */

const SECRET_KEYS = new Set([
  'password',
  'code',
  'otp',
  'token',
  'resetToken',
  'reset_token',
  'signedUrl',
  'signed_url',
  'authorization',
  'apiKey',
  'api_key',
])

export function isEmailProductionEnvironment() {
  return process.env.NODE_ENV === 'production'
}

export function maskEmailForLog(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0 || at === trimmed.length - 1) return '***'

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const visible = local.slice(0, 1) || '*'
  return `${visible}***@${domain}`
}

export function buildEmailStubLog(input: {
  template: string
  email?: string | null
  resourceId?: string | null
  extra?: Record<string, string | number | boolean | null | undefined>
}) {
  const safeExtra: Record<string, string | number | boolean | null> = {}
  if (input.extra) {
    for (const [key, value] of Object.entries(input.extra)) {
      if (SECRET_KEYS.has(key)) continue
      if (value === undefined) continue
      safeExtra[key] = value
    }
  }

  return {
    template: input.template,
    emailHint: maskEmailForLog(input.email),
    resourceId: input.resourceId ?? null,
    environment: isEmailProductionEnvironment() ? 'production' : 'development',
    ...safeExtra,
  }
}

/** Returns true when missing Resend must hard-fail (production). */
export function mustFailWithoutResend() {
  return isEmailProductionEnvironment()
}
