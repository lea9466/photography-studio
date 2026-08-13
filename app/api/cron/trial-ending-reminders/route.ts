import { NextRequest, NextResponse } from 'next/server'
import { authorizeCronRequest } from '@/lib/cron/authorize'
import { runTrialEndingReminders } from '@/lib/trial/trial-ending-reminders'
import { runTrialExpiredNotifications } from '@/lib/trial/trial-expired-notifications'

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

  const body = { ok: !hadFailure, reminders, expired }
  console.info('[trial-ending-reminders] cron response', body)
  return cronJson(body, hadFailure ? 500 : 200)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
