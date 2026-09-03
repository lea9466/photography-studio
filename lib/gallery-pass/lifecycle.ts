import { createAdminClient } from '@/lib/supabase/admin'
import { sendGalleryPassExpiringEmail } from '@/lib/email/resend'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_LEAD_DAYS = 3
const ABANDONED_DRAFT_HOURS = 48

type GalleryRow = { id: string }
type ReminderRow = {
  id: string
  title: string
  user_id: string
  expires_at: string
}

/**
 * Daily housekeeping for pay-per-gallery passes. Three independent passes, each
 * safe to re-run:
 *   1. lock galleries whose client window (expires_at) has closed — client
 *      access is already blocked by the expires_at check in the client-gallery
 *      loader, this is for dashboard clarity and to stop resend attempts;
 *   2. delete `pending` pass credits abandoned at checkout (charge never
 *      confirmed) after a grace period;
 *   3. email the photographer ~3 days before a paid gallery's window closes.
 */
export async function runGalleryPassLifecycle() {
  const admin = createAdminClient()
  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  // 1. Lock expired pass galleries.
  const { data: expiredRows } = await admin
    .from('galleries')
    .select('id')
    .not('pass_bundle_id', 'is', null)
    .not('expires_at', 'is', null)
    .lt('expires_at', nowIso)
    .neq('status', 'locked')
  const expiredIds = ((expiredRows ?? []) as GalleryRow[]).map((r) => r.id)
  if (expiredIds.length > 0) {
    await admin
      .from('galleries')
      .update({ status: 'locked' } as never)
      .in('id', expiredIds)
  }

  // 2. Delete abandoned pending credits (checkout opened, never paid).
  const abandonedCutoff = new Date(now - ABANDONED_DRAFT_HOURS * 60 * 60 * 1000).toISOString()
  const { data: abandonedRows } = await admin
    .from('gallery_pass_credits')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', abandonedCutoff)
  const abandonedIds = ((abandonedRows ?? []) as GalleryRow[]).map((r) => r.id)
  if (abandonedIds.length > 0) {
    await admin.from('gallery_pass_credits').delete().in('id', abandonedIds)
  }

  // 3. Expiry reminders (claim-then-send so an overlap can't double-notify).
  const reminderWindowEnd = new Date(now + REMINDER_LEAD_DAYS * DAY_MS).toISOString()
  const { data: reminderRows } = await admin
    .from('galleries')
    .select('id, title, user_id, expires_at')
    .not('pass_bundle_id', 'is', null)
    .not('pass_purchased_at', 'is', null)
    .is('pass_expiry_reminder_sent_at', null)
    .gt('expires_at', nowIso)
    .lte('expires_at', reminderWindowEnd)

  let remindersSent = 0
  for (const row of (reminderRows ?? []) as ReminderRow[]) {
    const { data: claimed } = await admin
      .from('galleries')
      .update({ pass_expiry_reminder_sent_at: new Date().toISOString() } as never)
      .eq('id', row.id)
      .is('pass_expiry_reminder_sent_at', null)
      .select('id')
    if (!claimed || claimed.length === 0) continue

    try {
      await sendGalleryPassExpiringEmail({
        galleryId: row.id,
        galleryTitle: row.title,
        userId: row.user_id,
        expiresAt: row.expires_at,
      })
      remindersSent += 1
    } catch (error) {
      console.error('[gallery-pass-lifecycle] expiry reminder failed', {
        galleryId: row.id,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  return {
    locked: expiredIds.length,
    deletedAbandoned: abandonedIds.length,
    remindersSent,
  }
}
