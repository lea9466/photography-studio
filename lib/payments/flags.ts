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

/**
 * One-time payment fallback for cards that reject a recurring authorization
 * (e.g. immediate-debit "דיירקט" cards) — see createOneTimeCheckoutSession
 * in lib/payments/providers/sumit/sumit-provider.ts. Kept behind its own
 * flag, separate from PAYMENTS_CHECKOUT_ENABLED, since it needs its own
 * live smoke test before real customers can use it.
 */
export function isOneTimePaymentEnabled() {
  return process.env.ONE_TIME_PAYMENT_ENABLED === 'true'
}

/**
 * SUMIT PaymentsJS — the in-site card-entry + single `/billing/recurring/charge/`
 * flow that replaces the broken `beginredirect` two-step (see
 * docs/payments-architecture.md and `SumitProvider.createSubscription`). Needs
 * the two public keys below plus a live ₪29 smoke test before it goes primary,
 * so it stays behind its own flag; while off, the plan card falls back to the
 * one-time flow.
 */
export function isSumitPaymentsJsEnabled() {
  return (
    process.env.SUMIT_PAYMENTSJS_ENABLED === 'true' && isSumitPaymentsConfigured()
  )
}

/**
 * Maintenance switch (2026-08-27). The whole self-serve payment area shows
 * "אי אפשר לשלם עקב תקלה טכנית" and both charge endpoints refuse, until the
 * SUMIT PaymentsJS recurring flow is verified in a sandbox and turned on.
 * Independent of `isPaymentsCheckoutEnabled()` on purpose — entitlements / the
 * paywall are untouched.
 *
 * Defaults to ON. Set `PAYMENTS_MAINTENANCE=off` in the environment to lift it
 * (no code deploy needed) once a working flow is live.
 */
export function isPaymentsMaintenance() {
  return process.env.PAYMENTS_MAINTENANCE?.trim().toLowerCase() !== 'off'
}

/** Both keys are public by design — SUMIT prints them on every hosted page. */
export function isSumitPaymentsConfigured() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUMIT_API_PUBLIC_KEY?.trim())
  )
}
