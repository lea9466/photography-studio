import { PaymentError } from '../../errors'
import type { SubscriptionStatus } from '../../types'

/**
 * Official PayMe `sub_status` values (confirmed).
 *
 * 1 = Initial - Not paid yet
 * 2 = Active - Paid successfully
 * 3 = Paused
 * 4 = Failed
 * 5 = Cancelled
 * 6 = Completed
 * 76 = Failed - Pending automatic retry
 *
 * Important: `sub_status === 2` alone must never activate local billing.
 * Activation requires full S2S verification first.
 */
export const PAYME_SUB_STATUS = {
  initial: 1,
  active: 2,
  paused: 3,
  failed: 4,
  cancelled: 5,
  completed: 6,
  failed_pending_retry: 76,
} as const

export type PayMeKnownSubStatusName = keyof typeof PAYME_SUB_STATUS

const LOCAL_BY_NAME: Record<PayMeKnownSubStatusName, SubscriptionStatus> = {
  initial: 'pending',
  active: 'active',
  paused: 'paused',
  failed: 'payment_failed',
  cancelled: 'cancelled',
  completed: 'expired',
  failed_pending_retry: 'past_due',
}

export function isPayMeSubscriptionStatusMappingConfigured(): boolean {
  return Object.keys(PAYME_SUB_STATUS).length > 0
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function findStatusName(numeric: number): PayMeKnownSubStatusName | null {
  for (const [name, value] of Object.entries(PAYME_SUB_STATUS)) {
    if (value === numeric) return name as PayMeKnownSubStatusName
  }
  return null
}

/**
 * Maps a PayMe numeric sub_status to a local SubscriptionStatus.
 * Unknown numeric values remain fail-closed.
 */
export function mapPaymeSubscriptionStatus(value: unknown): SubscriptionStatus {
  const numeric = asNumber(value)
  if (numeric === null) throw new PaymentError('verification_failed')

  const name = findStatusName(numeric)
  if (!name) throw new PaymentError('verification_failed')

  return LOCAL_BY_NAME[name]
}

export function isPaymeSubscriptionActive(value: unknown): boolean {
  return mapPaymeSubscriptionStatus(value) === 'active'
}

export function isPaymeSubscriptionCancelled(value: unknown): boolean {
  return mapPaymeSubscriptionStatus(value) === 'cancelled'
}

export function isPaymeSubscriptionPaused(value: unknown): boolean {
  return mapPaymeSubscriptionStatus(value) === 'paused'
}

export function isPaymeSubscriptionFailed(value: unknown): boolean {
  const status = mapPaymeSubscriptionStatus(value)
  return status === 'payment_failed' || status === 'past_due'
}

/** @deprecated use mapPaymeSubscriptionStatus */
export function mapPayMeSubStatusToLocal(value: unknown): SubscriptionStatus {
  return mapPaymeSubscriptionStatus(value)
}
