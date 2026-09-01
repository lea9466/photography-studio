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
 *
 * The `PAYMENTS_SMOKE_TEST_USER_ID` account is let through even while it's ON,
 * so the real ₪29 production test can run before customers get access.
 */
export function isPaymentsMaintenance(userId?: string) {
  const on = process.env.PAYMENTS_MAINTENANCE?.trim().toLowerCase() !== 'off'
  if (!on) return false
  if (userId && isPaymentsSmokeTestUser(userId)) return false
  return true
}

/** Both keys are public by design — SUMIT prints them on every hosted page. */
export function isSumitPaymentsConfigured() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUMIT_API_PUBLIC_KEY?.trim())
  )
}

/**
 * Separate kill switch for the private-gallery product's checkout (Starter /
 * Pro / Unlimited). The public-site product's own flags
 * (isPaymentsCheckoutAllowed / isSumitPaymentsJsEnabled) are already live in
 * production and are NOT product-specific — without this, shipping the
 * private-gallery UI would immediately let real customers pay for it too.
 * Defaults OFF (unset/anything but "true") so the tab, tier info and usage
 * counts can ship and be reviewed while the actual charge button stays
 * hidden until a live smoke test, same rollout shape as SUMIT_PAYMENTSJS_ENABLED.
 */
export function isPrivateGalleryCheckoutEnabled() {
  return process.env.PRIVATE_GALLERY_CHECKOUT_ENABLED === 'true'
}
