export const IMPERSONATION_COOKIE = 'impersonated_user_id'
export const IMPERSONATION_MAX_AGE_SEC = 2 * 60 * 60

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidImpersonationUserId(userId: string | null | undefined) {
  if (!userId) return false
  return UUID_RE.test(userId.trim())
}

export function impersonationCookieOptions(maxAge = IMPERSONATION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  }
}
