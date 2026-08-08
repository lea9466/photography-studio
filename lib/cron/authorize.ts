import { timingSafeEqual } from 'node:crypto'

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

/**
 * Shared cron auth check. Missing or mismatched secrets always fail closed.
 */
export function authorizeCronRequest(
  authHeader: string | null | undefined,
  cronSecret: string | null | undefined = process.env.CRON_SECRET
): boolean {
  if (!cronSecret) return false
  if (!authHeader) return false
  return timingSafeStringEqual(authHeader, `Bearer ${cronSecret}`)
}
