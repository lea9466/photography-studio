import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { canUseFeature } from './entitlements'
import { getStudioEntitlements } from './loader'
import {
  PRO_ONLY_ERROR_CODE,
  PRO_ONLY_ERROR_MESSAGE,
  type ProFeature,
} from './types'

/**
 * Server-side PRO guard for actions. Throws when a FREE user attempts a
 * mutation on a PRO-only feature — this is the server-side enforcement layer
 * (section 12 of the spec): direct URLs, server actions and API routes are all
 * blocked regardless of any disabled button in the UI.
 */
export class ProFeatureBlockedError extends Error {
  readonly code = PRO_ONLY_ERROR_CODE
  constructor(public readonly feature: ProFeature) {
    super(PRO_ONLY_ERROR_MESSAGE)
    this.name = 'ProFeatureBlockedError'
  }
}

export function isProFeatureBlockedError(
  error: unknown
): error is ProFeatureBlockedError {
  return (
    error instanceof ProFeatureBlockedError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === PRO_ONLY_ERROR_CODE)
  )
}

export async function requireProFeature(
  feature: ProFeature
): Promise<{
  userId: string
  isImpersonating: boolean
  actorEmail: string | null
}> {
  const context = await requireDashboardContext()
  await assertFeatureAllowed(context.userId, feature)
  return context
}

/**
 * Throws `ProFeatureBlockedError` for FREE users. Reuses an already-resolved
 * userId so actions don't pay for a second auth round-trip.
 */
export async function assertFeatureAllowed(
  userId: string,
  feature: ProFeature
): Promise<void> {
  const entitlements = await getStudioEntitlements(userId)
  if (!canUseFeature(entitlements, feature)) {
    throw new ProFeatureBlockedError(feature)
  }
}
