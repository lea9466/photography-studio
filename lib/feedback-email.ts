const DEFAULT_FEEDBACK_EMAIL = 'lea0556769466@gmail.com'

export function getFeedbackEmail() {
  return process.env.FEEDBACK_EMAIL?.trim() || DEFAULT_FEEDBACK_EMAIL
}
