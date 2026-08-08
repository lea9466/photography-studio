/**
 * Server-side payment feature flags.
 * Only the exact string "true" enables a flag; unset/false/other keep it off.
 */

export function isPaymentsCheckoutEnabled() {
  return process.env.PAYMENTS_CHECKOUT_ENABLED === 'true'
}
