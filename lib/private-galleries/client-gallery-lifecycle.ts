import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendClientGalleryDeletionWarningEmail,
  sendGalleryPassExpiringEmail,
} from '@/lib/email/resend'
import { deleteClientGalleryCompletely } from '@/lib/private-galleries/delete-client-gallery'

const DAY_MS = 24 * 60 * 60 * 1000
const PASS_REMINDER_LEAD_DAYS = 3
const ABANDONED_CREDIT_HOURS = 48

/** Warning schedule: how many days before deletion each stage fires. */
const WARNING_STAGES = [
  { stage: 3, withinDays: 1 },
  { stage: 2, withinDays: 3 },
  { stage: 1, withinDays: 14 },
] as const

type IdRow = { id: string }
type LifecycleGalleryRow = {
  id: string
  title: string
  user_id: string
  expires_at: string
  deletion_warning_stage: number
}

/** Days from `now` until `iso`, rounded up (so "in 0.3 days" → 1). Exported for tests. */
export function daysUntil(iso: string, now: number): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS)
}

/**
 * The warning stage a gallery should be at given days-to-deletion: 3 (≤1 day),
 * 2 (≤3), 1 (≤14), 0 (further out). The cron only ever advances the stage, so a
 * missed run just skips the intermediate emails. Exported for tests.
 */
export function targetWarningStage(daysLeft: number): number {
  for (const { stage, withinDays } of WARNING_STAGES) {
    if (daysLeft <= withinDays) return stage
  }
  return 0
}

/**
 * Daily housekeeping for client (selection) galleries — the "one-time use +
 * 60-day life" model (docs/private-gallery-lifecycle-plan.md). Each step is
 * independent and safe to re-run:
 *
 *   1. deletion warnings — email the photographer 14 / 3 / 1 days before a sent
 *      gallery's expires_at (its deletion date), claim-then-send;
 *   2. deletion — once expires_at has passed, permanently remove the gallery,
 *      its photos and all R2 storage;
 *   3. grandfathered pass galleries (sent before phase 1, photos_locked_at
 *      null → NOT in the auto-delete regime): keep the old "window closing"
 *      reminder ~3 days out, and lock them when the window closes;
 *   4. delete `pending` pass credits abandoned at checkout.
 */
export async function runClientGalleryLifecycle() {
  const admin = createAdminClient()
  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  // --- 1. Deletion warnings for sent client galleries -----------------------
  const warningWindowEnd = new Date(now + 14 * DAY_MS).toISOString()
  const { data: warnCandidates } = await admin
    .from('galleries')
    .select('id, title, user_id, expires_at, deletion_warning_stage')
    .eq('gallery_type', 'selection')
    .not('photos_locked_at', 'is', null)
    .not('expires_at', 'is', null)
    .gt('expires_at', nowIso)
    .lte('expires_at', warningWindowEnd)
    .lt('deletion_warning_stage', 3)

  let deletionWarningsSent = 0
  for (const row of (warnCandidates ?? []) as LifecycleGalleryRow[]) {
    const daysLeft = daysUntil(row.expires_at, now)
    const target = targetWarningStage(daysLeft)
    if (target <= row.deletion_warning_stage) continue

    const { data: claimed } = await admin
      .from('galleries')
      .update({ deletion_warning_stage: target } as never)
      .eq('id', row.id)
      .eq('deletion_warning_stage', row.deletion_warning_stage)
      .select('id')
    if (!claimed || claimed.length === 0) continue

    try {
      await sendClientGalleryDeletionWarningEmail({
        galleryId: row.id,
        galleryTitle: row.title,
        userId: row.user_id,
        deletionAt: row.expires_at,
        daysLeft: Math.max(1, daysLeft),
      })
      deletionWarningsSent += 1
    } catch (error) {
      console.error('[client-gallery-lifecycle] deletion warning failed', {
        galleryId: row.id,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  // --- 2. Delete galleries whose life is over ------------------------------
  const { data: expiredRows } = await admin
    .from('galleries')
    .select('id')
    .eq('gallery_type', 'selection')
    .not('photos_locked_at', 'is', null)
    .not('expires_at', 'is', null)
    .lte('expires_at', nowIso)

  let galleriesDeleted = 0
  for (const row of (expiredRows ?? []) as IdRow[]) {
    try {
      await deleteClientGalleryCompletely(row.id)
      galleriesDeleted += 1
    } catch (error) {
      console.error('[client-gallery-lifecycle] gallery deletion failed', {
        galleryId: row.id,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  // --- 3. Grandfathered pass galleries (photos_locked_at IS NULL) ----------
  // Not in the auto-delete regime; keep the pre-phase-1 behaviour: lock them
  // when the window closes, and remind the photographer ~3 days before.
  const { data: legacyExpired } = await admin
    .from('galleries')
    .select('id')
    .is('photos_locked_at', null)
    .not('pass_bundle_id', 'is', null)
    .not('expires_at', 'is', null)
    .lt('expires_at', nowIso)
    .neq('status', 'locked')
  const legacyExpiredIds = ((legacyExpired ?? []) as IdRow[]).map((r) => r.id)
  if (legacyExpiredIds.length > 0) {
    await admin.from('galleries').update({ status: 'locked' } as never).in('id', legacyExpiredIds)
  }

  const legacyReminderEnd = new Date(now + PASS_REMINDER_LEAD_DAYS * DAY_MS).toISOString()
  const { data: legacyReminders } = await admin
    .from('galleries')
    .select('id, title, user_id, expires_at, deletion_warning_stage')
    .is('photos_locked_at', null)
    .not('pass_bundle_id', 'is', null)
    .not('pass_purchased_at', 'is', null)
    .is('pass_expiry_reminder_sent_at', null)
    .gt('expires_at', nowIso)
    .lte('expires_at', legacyReminderEnd)

  let legacyPassReminders = 0
  for (const row of (legacyReminders ?? []) as LifecycleGalleryRow[]) {
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
      legacyPassReminders += 1
    } catch (error) {
      console.error('[client-gallery-lifecycle] legacy pass reminder failed', {
        galleryId: row.id,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    }
  }

  // --- 4. Abandoned pending pass credits ----------------------------------
  const abandonedCutoff = new Date(now - ABANDONED_CREDIT_HOURS * 60 * 60 * 1000).toISOString()
  const { data: abandoned } = await admin
    .from('gallery_pass_credits')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', abandonedCutoff)
  const abandonedIds = ((abandoned ?? []) as IdRow[]).map((r) => r.id)
  if (abandonedIds.length > 0) {
    await admin.from('gallery_pass_credits').delete().in('id', abandonedIds)
  }

  return {
    deletionWarningsSent,
    galleriesDeleted,
    legacyPassLocked: legacyExpiredIds.length,
    legacyPassReminders,
    deletedAbandonedCredits: abandonedIds.length,
  }
}
