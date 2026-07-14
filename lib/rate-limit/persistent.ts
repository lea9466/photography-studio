import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Persistent rate limiting backed by the generic admin_rate_limit_check
// Postgres function (see supabase/migrations/20250713000001_add_admin_rate_limits.sql).
// Despite the "admin_" naming (it was introduced for the admin OTP flow), the
// table/RPC are keyed by an arbitrary text key and are not admin-specific —
// this is the same shared infra, reused here for the public contact form.
// Unlike an in-memory counter (lib/rate-limit/gallery-password.ts), this is
// enforced consistently across every Vercel serverless instance since
// Postgres is the single shared source of truth, and the check+increment
// happens atomically in one DB round trip.
//
// Note: an equivalent helper already exists as a private function inside
// lib/actions/admin.actions.ts. It is intentionally NOT refactored to import
// from here — that file was previously audited/hardened as its own unit and
// is being left untouched. This does mean the same ~20 lines exist in both
// places; consolidate later if desired.

export type PersistentRateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

export async function checkPersistentRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<PersistentRateLimitResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('admin_rate_limit_check', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    })
    .maybeSingle()

  if (error) {
    // Fail OPEN on infrastructure errors (network/DB issues) — a Supabase
    // hiccup must never block a legitimate visitor from reaching a
    // photographer through their own site's contact form. Still logged
    // (not silenced) so an outage or misconfiguration doesn't go unnoticed.
    console.error('[contact-rate-limit] check failed, failing open:', {
      key,
      error: error.message,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  return {
    allowed: data?.allowed ?? true,
    retryAfterSeconds: data?.retry_after_seconds ?? 0,
  }
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers()
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip')?.trim() ??
    'unknown'
  )
}
