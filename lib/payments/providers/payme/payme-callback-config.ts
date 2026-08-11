/**
 * Official PayMe subscription callback Content-Type for subscription callbacks.
 * The documentation confirms this is form-urlencoded.
 */
export const PAYME_CALLBACK_CONTENT_TYPE_CANDIDATES = [
  'application/x-www-form-urlencoded',
] as const

export type PayMeCallbackContentType =
  (typeof PAYME_CALLBACK_CONTENT_TYPE_CANDIDATES)[number]

/**
 * Official callback Content-Type confirmed by PayMe docs.
 */
export const PAYME_CALLBACK_CONTENT_TYPE: PayMeCallbackContentType | null = 'application/x-www-form-urlencoded'

export function isAllowedPayMeCallbackContentType(
  headerValue: string | null,
  configured: PayMeCallbackContentType | null = PAYME_CALLBACK_CONTENT_TYPE
): boolean {
  if (!configured) return false
  if (!headerValue) return false
  const normalized = headerValue.toLowerCase().split(';')[0]?.trim() ?? ''
  return normalized === configured
}
