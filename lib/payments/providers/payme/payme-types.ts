/** PayMe environment configuration. */
export type PayMeEnvironment = {
  apiBaseUrl: string
  /** Optional partner/platform key; omitted for regular Seller sandbox flows. */
  clientKey: string | null
  /** Sent as `seller_payme_id`. */
  sellerId: string
  /** Reserved for future signature verification — algorithm not yet provided. */
  webhookSecret: string
  env: 'sandbox' | 'production'
}

export const PAYME_SANDBOX_API_BASE_URL = 'https://sandbox.payme.io/api'
export const PAYME_PRODUCTION_API_BASE_URL = 'https://live.payme.io/api'
export const PAYME_LIVE_HOST = 'live.payme.io'

/** Official notify_type values for subscription callbacks. */
export const PAYME_NOTIFY_TYPES = [
  'sub-create',
  'sub-failure',
  'sub-active',
  'sub-cancel',
  'sub-pause',
  'sub-complete',
  'sub-iteration-success',
  'sub-iteration-skipped',
] as const
export type PayMeNotifyType = (typeof PAYME_NOTIFY_TYPES)[number]

/** Confirmed iteration types used by this product. */
export const PAYME_ITERATION_TYPE_MONTHLY = 3
export const PAYME_ITERATION_TYPE_YEARLY = 4

export type PayMeIterationType =
  | typeof PAYME_ITERATION_TYPE_MONTHLY
  | typeof PAYME_ITERATION_TYPE_YEARLY

/** Official numeric subscription statuses — see payme-subscription-statuses.ts */
export type PayMeSubStatus = 1 | 2 | 3 | 4 | 5 | 6 | 76 | number

/**
 * Official POST /get-subscriptions request fields.
 * Endpoint: https://sandbox.payme.io/api/get-subscriptions
 * Content-Type: application/json
 */
export type PayMeGetSubscriptionsRequest = {
  payme_client_key: string
  seller_payme_id: string
  seller_id?: string | number
  sub_payme_code?: string | number
  sub_payme_id?: string
  sub_created?: string
  sub_created_min?: string
  sub_created_max?: string
  sub_status?: PayMeSubStatus
  sub_iteration_type?: number
  sub_price?: number
  sub_currency?: string
  sub_iterations?: number
  sub_start_date?: string
  sub_paid?: boolean
  /** Our correlation id when searching by the echoed subscription_id value. */
  subscription_id?: string
  language?: string
}

/**
 * Official get-subscriptions item.
 * `sub_buyer_details` may appear — never persist card/social fields locally.
 */
export type PayMeSubscriptionRecord = {
  seller_payme_id?: string
  seller_id?: string | number | null
  sub_payme_id?: string
  /** Official response field name from PayMe docs. */
  payme_sub_code?: string | number
  /** Legacy/alternate code field seen in other PayMe payloads. */
  sub_payme_code?: string | number
  subscription_id?: string | number | null
  sub_created?: string | null
  sub_start_date?: string | null
  sub_prev_date?: string | null
  sub_next_date?: string | null
  sub_status?: PayMeSubStatus
  sub_iteration_type?: number
  sub_currency?: string
  sub_price?: number | string
  sub_description?: string | null
  sub_iterations?: number
  sub_iterations_completed?: number
  sub_iterations_skipped?: number
  sub_iterations_left?: number
  sub_payment_date?: string | null
  sub_error_text?: string | null
  sub_paid?: boolean
  /** Present in official docs — do not store PII/card data from this object. */
  sub_buyer_details?: unknown
  status_code?: number | string
  payme_status?: string
  status_error_code?: number
}

export type PayMeGetSubscriptionsResponse = {
  items_count?: number
  items?: PayMeSubscriptionRecord[]
  status_code?: number | string
  payme_status?: string
  status_error_code?: number
}

export type PayMeGetTransactionsRequest = {
  payme_client_key: string
  seller_payme_id: string
  transaction_id?: string | number
  payme_transaction_id?: string
  payme_sale_id?: string
  sale_status?: string
  transaction_status?: string | number
  language?: string
}

export type PayMeTransactionRecord = {
  seller_payme_id?: string
  transaction_id?: string | number
  payme_transaction_id?: string
  payme_sale_id?: string
  payme_sale_code?: string | number
  sale_status?: string
  /** Complementary only — not sufficient proof of payment alone. */
  transaction_status?: string | number
  transaction_price?: number | string
  sale_price?: number | string
  sale_currency?: string
  currency?: string
  transaction_error_code?: number | string
  status_code?: number | string
  payme_status?: string
  status_error_code?: number
  sale_description?: string | null
  transaction_date?: string | null
}

export type PayMeGetTransactionsResponse = {
  status_code?: number | string
  payme_status?: string
  status_error_code?: number
  items?: PayMeTransactionRecord[]
  transactions?: PayMeTransactionRecord[]
} & PayMeTransactionRecord

/**
 * Known fields for generate-subscription.
 * Includes the official correlation field `subscription_id` and the sandbox client key.
 */
export type PayMeGenerateSubscriptionRequestKnown = {
  payme_client_key?: string
  seller_payme_id: string
  subscription_id: string
  sub_price: number
  sub_currency: string
  sub_description: string
  sub_iteration_type: PayMeIterationType
  /** Recurrence count. Use -1 for indefinite recurring charges. */
  sub_iterations: number
  sub_start_date: string
  sub_callback_url: string
  sub_return_url: string
  language: 'he'
  test?: 1
}

export type PayMeGenerateSubscriptionResponse = {
  sub_url?: string
  status_code?: number | string
  payme_status?: string
  status_error_code?: number
  seller_payme_id?: string
  sub_payme_id?: string
  sub_payme_code?: string | number
  payme_sub_code?: string | number
  subscription_id?: string | number
  sub_status?: PayMeSubStatus
  sub_iteration_type?: number
  sub_currency?: string
  sub_price?: number | string
  sub_paid?: boolean
  sub_error_text?: string | null
}

/** Identifiers extracted from an untrusted callback — never used as source of truth. */
export type PayMeCallbackIdentifiers = {
  notifyType: PayMeNotifyType | 'unknown'
  subscriptionId: string | null
  subPaymeId: string | null
  subPaymeCode: string | number | null
  paymeSaleId: string | null
  sellerPaymeId: string | null
  raw: Record<string, unknown>
}

export function payMeSubscriptionCode(
  record: PayMeSubscriptionRecord
): string | number | null {
  return record.payme_sub_code ?? record.sub_payme_code ?? null
}
