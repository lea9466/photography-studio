import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseBillingRepository } from './repository'
import { SumitProvider } from './providers/sumit/sumit-provider'

/**
 * SUMIT auto-renews recurring subscriptions on its own schedule
 * (`Date_NextBilling`) with no webhook to tell this app it happened (see
 * docs/payments-architecture.md's SUMIT PaymentsJS section — "period-end
 * reconciliation is a follow-up cron using getSubscription / listforcustomer",
 * which this is). Without this sweep, `subscriptions.current_period_end`
 * stays frozen at whatever was computed locally when the subscription was
 * first created (now + one billing interval) — a customer SUMIT keeps
 * successfully billing would eventually read as lapsed to
 * `hasActiveSubscription` (subscription-service.ts) the instant that stale
 * date passes.
 *
 * Deliberately narrow: only syncs `current_period_end` / `next_payment_at`
 * from SUMIT's `Date_NextBilling`. Never touches `status` from SUMIT's
 * response — `RECURRING_STATUS_MAP` in sumit-mapper.ts is documented as
 * unreliable in practice (every real item observed so far reports
 * `Status: 1` regardless of health); status stays driven by the existing
 * explicit paths (checkout completion, `cancelSubscription`).
 */
export async function reconcileSumitSubscriptionPeriods(): Promise<{
  checked: number
  updated: number
  failed: number
}> {
  const admin = createAdminClient()
  const repository = new SupabaseBillingRepository(admin)
  const provider = new SumitProvider()

  const { data, error } = await admin
    .from('subscriptions')
    .select('id, provider_subscription_id, current_period_end')
    .eq('provider', 'sumit')
    .eq('payment_type', 'recurring')
    .eq('status', 'active')

  if (error) throw new Error(`failed to list active sumit subscriptions: ${error.message}`)

  // Only rows created by the real recurring flow encode `customerId:recurringItemId`
  // (see buildSumitSubscriptionId/parseSumitSubscriptionId in sumit-mapper.ts) —
  // a still-pending row's id is the local `sub_...` placeholder, which SUMIT
  // has never heard of.
  const rows = ((data ?? []) as {
    id: string
    provider_subscription_id: string | null
    current_period_end: string | null
  }[]).filter(
    (row) =>
      typeof row.provider_subscription_id === 'string' &&
      row.provider_subscription_id.includes(':')
  )

  let updated = 0
  let failed = 0

  for (const row of rows) {
    try {
      const remote = await provider.getSubscription(row.provider_subscription_id as string)
      if (remote.nextPaymentAt && remote.nextPaymentAt !== row.current_period_end) {
        await repository.updateSubscription(row.id, {
          periodEnd: remote.nextPaymentAt,
          nextPaymentAt: remote.nextPaymentAt,
        })
        updated += 1
      }
    } catch (err) {
      failed += 1
      console.error('[payments][sumit-period-reconciliation] failed', {
        subscriptionId: row.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { checked: rows.length, updated, failed }
}
