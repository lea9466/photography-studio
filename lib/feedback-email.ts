const DEFAULT_FEEDBACK_EMAIL = 'lea0556769466@gmail.com'
const DEFAULT_ADMIN_NAME = 'לאה'

/**
 * This email also determines who is authorized to log into the admin panel
 * (see requestAdminLoginCode / isPlatformAdminEmail), so it must never fall
 * back silently in production — a missing env var should fail loudly rather
 * than defaulting to a hardcoded personal address.
 */
export function getFeedbackEmail() {
  const configured = process.env.FEEDBACK_EMAIL?.trim()
  if (configured) return configured

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FEEDBACK_EMAIL is required in production')
  }

  return DEFAULT_FEEDBACK_EMAIL
}

export function getAdminName() {
  return process.env.ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME
}
