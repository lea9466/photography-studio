/**
 * Server-side payment feature flags.
 * Only the exact string "true" enables a flag; unset/false/other keep it off.
 */

export function isPaymentsCheckoutEnabled() {
  return process.env.PAYMENTS_CHECKOUT_ENABLED === 'true'
}

export function getPaymentsSmokeTestUserId() {
  return process.env.PAYMENTS_SMOKE_TEST_USER_ID?.trim() || null
}

export function isPaymentsCheckoutAllowed(userId: string) {
  if (isPaymentsCheckoutEnabled()) return true
  const smokeTestUserId = getPaymentsSmokeTestUserId()
  return smokeTestUserId !== null && smokeTestUserId === userId
}

export function isPaymentsSmokeTestUser(userId: string) {
  const smokeTestUserId = getPaymentsSmokeTestUserId()
  return smokeTestUserId !== null && smokeTestUserId === userId
}
