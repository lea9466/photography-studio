import { NextRequest, NextResponse } from 'next/server'
import { authorizeCronRequest } from '@/lib/cron/authorize'
import { runTrialEndingReminders } from '@/lib/trial/trial-ending-reminders'

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

  try {
    const result = await runTrialEndingReminders()
    const body = {
      ok: true as const,
      enabled: result.enabled,
      mode: result.mode,
      status: result.status,
      candidates: result.candidates,
      claimed: result.claimed,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    }
    // Log the exact payload returned to the caller for this invocation.
    console.info('[trial-ending-reminders] cron response', body)
    return cronJson(body)
  } catch (error) {
    console.error('[trial-ending-reminders] cron failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    return cronJson({ error: 'Reminder job failed' }, 500)
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
