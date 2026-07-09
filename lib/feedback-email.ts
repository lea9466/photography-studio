const DEFAULT_FEEDBACK_EMAIL = 'lea0556769466@gmail.com'
const DEFAULT_ADMIN_NAME = 'לאה'

export function getFeedbackEmail() {
  return process.env.FEEDBACK_EMAIL?.trim() || DEFAULT_FEEDBACK_EMAIL
}

export function getAdminName() {
  return process.env.ADMIN_NAME?.trim() || DEFAULT_ADMIN_NAME
}
