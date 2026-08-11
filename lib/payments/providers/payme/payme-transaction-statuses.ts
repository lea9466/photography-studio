import { PaymentError } from '../../errors'

/**
 * Official PayMe `transaction_status` values (confirmed).
 *
 * Complementary metadata only — never sufficient proof of a successful charge.
 * Happy-path payment proof remains:
 * status_code=0, sale_status=completed, transaction_error_code=20000,
 * matching seller/amount/currency, and idempotency.
 */
export const PAYME_TRANSACTION_STATUS = {
  pending: 1,
  validated: 2,
  refunded: 3,
  partial_refund: 4,
  failed: 5,
  chargeback: 6,
  chargeback_refund: 7,
  voided: 8,
  partial_void: 9,
  partial_chargeback: 10,
  partial_chargeback_refund: 11,
} as const

export type PayMeTransactionStatusName = keyof typeof PAYME_TRANSACTION_STATUS
export type PayMeTransactionStatusCode =
  (typeof PAYME_TRANSACTION_STATUS)[PayMeTransactionStatusName]

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function mapPaymeTransactionStatus(
  value: unknown
): PayMeTransactionStatusName {
  const numeric = asNumber(value)
  if (numeric === null) throw new PaymentError('verification_failed')

  for (const [name, code] of Object.entries(PAYME_TRANSACTION_STATUS)) {
    if (code === numeric) return name as PayMeTransactionStatusName
  }

  throw new PaymentError('verification_failed')
}

export function isPaymeTransactionStatusKnown(value: unknown): boolean {
  try {
    mapPaymeTransactionStatus(value)
    return true
  } catch {
    return false
  }
}
