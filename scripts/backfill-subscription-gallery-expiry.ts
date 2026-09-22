/**
 * One-time backfill for the "galleries persist while subscribed" change
 * (docs/private-gallery-lifecycle-plan.md, 23/09 update — see
 * lib/private-galleries/entitlements.ts's galleryPersistsWhileSubscribed).
 *
 * sendGallery (lib/actions/gallery.actions.ts) now only sets expires_at for
 * free-tier and gallery-pass sends going forward — a gallery sent under an
 * active paid subscription gets none, so it never enters the deletion
 * pipeline. But every non-pass client gallery already sent before this
 * change shipped still carries a ticking expires_at from the old "60 days
 * from send, always" model. This script clears expires_at (and resets
 * deletion_warning_stage) on exactly the rows that would NOT have gotten one
 * had the new code been live at send time — i.e. galleries owned by a studio
 * who CURRENTLY resolves to an active subscription. That's a best-effort
 * proxy (there is no stored history of what her entitlement was back when
 * she actually sent each gallery), the same rationale the team already used
 * for the phase-1 grandfathering of pre-deploy galleries.
 *
 * Free-tier-owned galleries are intentionally left untouched — they keep
 * their existing 60-day clock, unchanged, same as always.
 *
 * Run ONCE, manually, after the sendGallery change is live in production —
 * not on a recurring cron (an entitlement lookup per candidate gallery's
 * owner is too expensive to repeat daily; sendGallery already keeps new
 * sends correct going forward).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-subscription-gallery-expiry.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-subscription-gallery-expiry.ts
 */
import { createAdminClient } from '../lib/supabase/admin.ts'
import { getPrivateGalleryEntitlements } from '../lib/private-galleries/loader.ts'
import { galleryPersistsWhileSubscribed } from '../lib/private-galleries/entitlements.ts'

type CandidateRow = { id: string; user_id: string }

async function loadCandidates(admin: ReturnType<typeof createAdminClient>): Promise<CandidateRow[]> {
  const rows: CandidateRow[] = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('galleries')
      .select('id, user_id')
      .eq('gallery_type', 'selection')
      .is('pass_bundle_id', null)
      .not('photos_locked_at', 'is', null)
      .not('expires_at', 'is', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    const page = (data ?? []) as CandidateRow[]
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const admin = createAdminClient()

  const candidates = await loadCandidates(admin)
  console.log(`Found ${candidates.length} sent, non-pass client gallery(ies) with a ticking expires_at.`)

  const byUser = new Map<string, string[]>()
  for (const row of candidates) {
    if (!row.user_id) continue
    const list = byUser.get(row.user_id) ?? []
    list.push(row.id)
    byUser.set(row.user_id, list)
  }
  console.log(`Across ${byUser.size} distinct studio(s).`)

  let studiosSubscribed = 0
  let studiosSkipped = 0
  let galleriesUpdated = 0

  for (const [userId, galleryIds] of byUser) {
    const pg = await getPrivateGalleryEntitlements(userId).catch((error) => {
      console.error(`  entitlement lookup failed for ${userId}, skipping:`, error)
      return null
    })
    if (!pg || !galleryPersistsWhileSubscribed(pg)) {
      studiosSkipped++
      continue
    }
    studiosSubscribed++

    if (dryRun) {
      console.log(`  [dry-run] would clear expires_at on ${galleryIds.length} gallery(ies) for ${userId} (tier=${pg.tier}, source=${pg.source})`)
      galleriesUpdated += galleryIds.length
      continue
    }

    const { error } = await admin
      .from('galleries')
      .update({ expires_at: null, deletion_warning_stage: 0 } as never)
      .in('id', galleryIds)
    if (error) {
      console.error(`  FAILED to update ${galleryIds.length} gallery(ies) for ${userId}:`, error.message)
      continue
    }
    galleriesUpdated += galleryIds.length
    console.log(`  cleared expires_at on ${galleryIds.length} gallery(ies) for ${userId} (tier=${pg.tier}, source=${pg.source})`)
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Done: ${studiosSubscribed} subscribed studio(s), ${galleriesUpdated} gallery(ies) ${dryRun ? 'would be' : ''} updated; ${studiosSkipped} studio(s) left untouched (free tier / no active subscription).`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
