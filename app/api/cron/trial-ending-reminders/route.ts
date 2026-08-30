import { NextRequest, NextResponse } from 'next/server'
import { authorizeCronRequest } from '@/lib/cron/authorize'
import { runTrialEndingReminders } from '@/lib/trial/trial-ending-reminders'
import { runTrialExpiredNotifications } from '@/lib/trial/trial-expired-notifications'
import { runOneTimePaymentReminders } from '@/lib/subscriptions/one-time-payment-reminders'
import { runOneTimePaymentExpiredNotifications } from '@/lib/subscriptions/one-time-payment-expired-notifications'
import { suspendCustomDomainsWithLapsedEntitlement } from '@/lib/domains/custom-domain-suspension'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function cronJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}

export async function GET(request: NextRequest) {
  if (!authorizeCronRequest(request.headers.get('authorization'))) {
    return cronJson({ error: 'Unauthorized' }, 401)
  }

  // Two independent jobs, each behind its own flag — a failure in one must
  // not block the other from running.
  let reminders: Record<string, unknown> = { error: 'did not run' }
  let expired: Record<string, unknown> = { error: 'did not run' }
  let hadFailure = false

  try {
    const result = await runTrialEndingReminders()
    reminders = {
      enabled: result.enabled,
      mode: result.mode,
      status: result.status,
      candidates: result.candidates,
      claimed: result.claimed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    }
  } catch (error) {
    hadFailure = true
    console.error('[trial-ending-reminders] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  try {
    const result = await runTrialExpiredNotifications()
    expired = {
      enabled: result.enabled,
      status: result.status,
      candidates: result.candidates,
      claimed: result.claimed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    }
  } catch (error) {
    hadFailure = true
    console.error('[trial-expired-notifications] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  // Same independent-jobs pattern as the two trial jobs above — one-time
  // payment (דיירקט) reminder/expiry emails, each behind its own flag.
  let oneTimeReminders: Record<string, unknown> = { error: 'did not run' }
  let oneTimeExpired: Record<string, unknown> = { error: 'did not run' }

  try {
    const result = await runOneTimePaymentReminders()
    oneTimeReminders = {
      enabled: result.enabled,
      status: result.status,
      candidates: result.candidates,
      claimed: result.claimed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    }
  } catch (error) {
    hadFailure = true
    console.error('[one-time-payment-reminders] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  try {
    const result = await runOneTimePaymentExpiredNotifications()
    oneTimeExpired = {
      enabled: result.enabled,
      status: result.status,
      candidates: result.candidates,
      claimed: result.claimed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    }
  } catch (error) {
    hadFailure = true
    console.error('[one-time-payment-expired-notifications] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  // Reconciliation for the custom-domain suspension direction — see
  // lib/domains/custom-domain-suspension.ts's doc comment for why this has
  // no single trigger moment and needs a periodic sweep (unlike reactivation,
  // which happens synchronously wherever entitlement is granted).
  let customDomainSuspension: Record<string, unknown> = { error: 'did not run' }

  try {
    const result = await suspendCustomDomainsWithLapsedEntitlement()
    customDomainSuspension = { checked: result.checked, suspended: result.suspended }
  } catch (error) {
    hadFailure = true
    console.error('[custom-domain-suspension] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
  }

  const body = {
    ok: !hadFailure,
    reminders,
    expired,
    oneTimeReminders,
    oneTimeExpired,
    customDomainSuspension,
  }
  console.info('[trial-ending-reminders] cron response', body)
  return cronJson(body, hadFailure ? 500 : 200)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
