/** Matches a plausible email address shape (not full RFC 5322) — good enough to
 * reject obvious garbage/wildcard-injection attempts before using the value in
 * a query or sending mail to/from it. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}
