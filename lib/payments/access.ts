/**
 * Subscription access enforcement helper.
 *
 * Intentionally unwired from middleware, layouts, and product guards.
 * Keep ENFORCE_SUBSCRIPTION_ACCESS unset/false until payments open and
 * enforcement is explicitly approved.
 */

export function isSubscriptionEnforcementEnabled() {
  return process.env.ENFORCE_SUBSCRIPTION_ACCESS === 'true'
}

/**
 * Soft access check for a future choke point.
 * When enforcement is off, every user remains allowed.
 */
export function evaluateStudioAccess(_input?: {
  trialEndDate?: string | null
  hasActivePaidSubscription?: boolean
}): { allowed: true } | { allowed: false; reason: 'subscription_required' } {
  if (!isSubscriptionEnforcementEnabled()) {
    return { allowed: true }
  }

  // Enforcement path is prepared but not connected to product code.
  // Callers must not use this until PayMe + product approval.
  return { allowed: true }
}
