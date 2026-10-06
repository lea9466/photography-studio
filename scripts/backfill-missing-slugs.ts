/**
 * One-time backfill: give every studio that has a business name but no slug
 * one derived from that name (same rule as the onboarding modal and the
 * settings form — lib/onboarding/available-slug.ts). Studios that chose
 * "private galleries only" in the site-setup modal (site_onboarding_skipped)
 * are left alone, so no public site address appears for someone who opted out.
 *
 * Usage (dry run first — prints the plan, writes nothing):
 *   npx tsx --env-file=.env.local scripts/backfill-missing-slugs.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-missing-slugs.ts
 */
import { createAdminClient } from '../lib/supabase/admin.ts'
import { findAvailableSlug } from '../lib/onboarding/available-slug.ts'

type Row = {
  id: string
  studio_name: string | null
  slug: string | null
  site_onboarding_skipped: boolean | null
}

const MIN_NAME_LENGTH = 2

async function loadRows(admin: ReturnType<typeof createAdminClient>): Promise<Row[]> {
  const rows: Row[] = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('users')
      .select('id, studio_name, slug, site_onboarding_skipped')
      .order('id')
      .range(from, from + pageSize - 1)
    if (error) throw error
    const page = (data ?? []) as Row[]
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const admin = createAdminClient()
  const rows = await loadRows(admin)

  const candidates = rows.filter(
    (r) =>
      !r.slug?.trim() &&
      (r.studio_name?.trim().length ?? 0) >= MIN_NAME_LENGTH &&
      !r.site_onboarding_skipped
  )
  const skippedOptOut = rows.filter((r) => !r.slug?.trim() && r.site_onboarding_skipped).length
  const noName = rows.filter(
    (r) => !r.slug?.trim() && !r.site_onboarding_skipped && (r.studio_name?.trim().length ?? 0) < MIN_NAME_LENGTH
  ).length

  console.log(
    `${rows.length} studios | ${candidates.length} to fill | ${skippedOptOut} opted out (galleries only) | ${noName} without a usable name`
  )

  let updated = 0
  let failed = 0
  for (const row of candidates) {
    const name = row.studio_name!.trim()
    const slug = await findAvailableSlug(admin, name, row.id)
    if (!slug) {
      console.warn(`no free slug for ${row.id} ("${name}")`)
      failed++
      continue
    }
    console.log(`${row.id}  "${name}"  ->  ${slug}`)
    if (dryRun) continue

    // Only while the slug is still empty, so one she set meanwhile survives.
    const { error } = await admin
      .from('users')
      .update({ slug } as never)
      .eq('id', row.id)
      .or('slug.is.null,slug.eq.')
    if (error) {
      console.warn(`update failed for ${row.id}: ${error.message}`)
      failed++
    } else {
      updated++
    }
  }

  console.log(dryRun ? 'dry run — nothing written' : `updated ${updated}, failed ${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
