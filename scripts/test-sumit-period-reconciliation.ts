process.env.PAYMENT_PROVIDER = 'sumit'

import { createAdminClient } from '../lib/supabase/admin'
import { reconcileSumitSubscriptionPeriods } from '../lib/payments/sumit-period-reconciliation'

/**
 * Manual, read-mostly check for reconcileSumitSubscriptionPeriods (see its
 * doc comment in lib/payments/sumit-period-reconciliation.ts). Runs against
 * the real production SUMIT account — SUMIT has no separate sandbox host
 * (see sumit-client.ts) — but only ever writes `current_period_end` /
 * `next_payment_at` on already-active recurring subscriptions to match what
 * SUMIT's own API already reports, exactly like the daily cron will. Safe to
 * re-run; a second run with nothing changed on SUMIT's side is a no-op.
 */
async function run() {
  const admin = createAdminClient()

  const select = 'id, user_id, provider_subscription_id, current_period_end, next_payment_at'

  const { data: before, error: beforeError } = await admin
    .from('subscriptions')
    .select(select)
    .eq('provider', 'sumit')
    .eq('payment_type', 'recurring')
    .eq('status', 'active')
  if (beforeError) throw beforeError

  console.log(`[reconcile] ${before?.length ?? 0} active sumit recurring subscription(s) BEFORE:`)
  console.table(before ?? [])

  const result = await reconcileSumitSubscriptionPeriods()
  console.log('[reconcile] result:', result)

  const { data: after, error: afterError } = await admin
    .from('subscriptions')
    .select(select)
    .eq('provider', 'sumit')
    .eq('payment_type', 'recurring')
    .eq('status', 'active')
  if (afterError) throw afterError

  console.log('[reconcile] AFTER:')
  console.table(after ?? [])
}

void run().catch((error) => {
  console.error('[reconcile] FAILED:', {
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
    detail: (error as { detail?: string })?.detail,
  })
  process.exitCode = 1
})
