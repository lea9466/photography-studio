/**
 * One-time rollout of the custom-domain-addon announcement email across 3
 * groups (to stay under a 100/day sending-provider quota), one group per
 * day. See supabase/migrations/20260831010000_add_custom_domain_announcement_tracking.sql.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/send-custom-domain-announcement.ts assign
 *   npx tsx --env-file=.env.local scripts/send-custom-domain-announcement.ts send <1|2|3> [--dry-run]
 *
 * "assign" computes the 3 groups ONCE (oldest studios first, newest last)
 * and is a safe no-op if groups are already assigned — it never reassigns.
 * "send" only ever emails a studio whose custom_domain_announcement_sent_at
 * is still null, and marks it sent immediately after each individual
 * successful send (not at the end of the batch) — so a crash or interrupt
 * mid-batch, or re-running the same command, never double-sends: already-
 * sent studios are simply skipped on the next run, and only the remaining
 * ones in that group go out.
 */
import { createAdminClient } from '../lib/supabase/admin.ts'
import { sendCustomDomainAddonAnnouncementEmail } from '../lib/email/resend.ts'

type UserRow = {
  id: string
  email: string | null
  name: string | null
  studio_name: string | null
  created_at: string
  custom_domain_announcement_group: number | null
  custom_domain_announcement_sent_at: string | null
}

const DELAY_BETWEEN_SENDS_MS = 700

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function assignGroups() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, studio_name, created_at, custom_domain_announcement_group, custom_domain_announcement_sent_at')
    .order('created_at', { ascending: true })
  if (error) throw error

  const rows = (data ?? []) as UserRow[]
  const alreadyAssigned = rows.filter((r) => r.custom_domain_announcement_group != null)
  if (alreadyAssigned.length > 0) {
    console.log(`Groups already assigned for ${alreadyAssigned.length} studio(s) — not reassigning.`)
    printGroupCounts(rows)
    return
  }

  // Lea's own account (studio owner, not a customer) — never part of the
  // announcement rollout. Same account behind both PAYMENTS_SMOKE_TEST_USER_ID
  // and MVP_BYPASS_USER_ID (confirmed: both resolve to the same row).
  const eligible = rows.filter((r) => r.email && r.email.trim() && r.email.trim() !== 'lea0556769466@gmail.com')

  const groupSize = Math.ceil(eligible.length / 3)
  for (let i = 0; i < eligible.length; i++) {
    const group = Math.min(3, Math.floor(i / groupSize) + 1)
    const { error: updateError } = await admin
      .from('users')
      .update({ custom_domain_announcement_group: group } as never)
      .eq('id', eligible[i].id)
    if (updateError) {
      console.error(`Failed to assign group for ${eligible[i].email}:`, updateError.message)
    }
  }

  console.log(`Assigned ${eligible.length} studio(s) into 3 groups (oldest -> group 1, newest -> group 3).`)
  const { data: after } = await admin
    .from('users')
    .select('id, custom_domain_announcement_group')
  printGroupCounts((after ?? []) as UserRow[])
}

function printGroupCounts(rows: { custom_domain_announcement_group: number | null }[]) {
  for (const g of [1, 2, 3]) {
    console.log(`  group ${g}: ${rows.filter((r) => r.custom_domain_announcement_group === g).length}`)
  }
  console.log(`  unassigned (excluded, e.g. no email / owner account): ${rows.filter((r) => r.custom_domain_announcement_group == null).length}`)
}

async function sendGroup(group: number, dryRun: boolean) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, studio_name, created_at, custom_domain_announcement_group, custom_domain_announcement_sent_at')
    .eq('custom_domain_announcement_group', group)
    .is('custom_domain_announcement_sent_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error

  const pending = (data ?? []) as UserRow[]
  console.log(`Group ${group}: ${pending.length} studio(s) pending (not yet sent).`)

  if (dryRun) {
    for (const row of pending) console.log(`  [dry-run] would send to ${row.email} (${row.studio_name ?? row.name ?? 'no name'})`)
    return
  }

  let sent = 0
  let failed = 0
  for (const row of pending) {
    if (!row.email) continue
    try {
      await sendCustomDomainAddonAnnouncementEmail({
        name: row.name?.trim() || row.studio_name?.trim() || 'שלום',
        email: row.email,
      })
      const { error: markError } = await admin
        .from('users')
        .update({ custom_domain_announcement_sent_at: new Date().toISOString() } as never)
        .eq('id', row.id)
        .is('custom_domain_announcement_sent_at', null)
      if (markError) {
        console.error(`  sent to ${row.email} but FAILED to mark as sent — will re-send on next run:`, markError.message)
        failed++
        continue
      }
      sent++
      console.log(`  sent to ${row.email}`)
    } catch (err) {
      failed++
      console.error(`  FAILED to send to ${row.email}:`, err instanceof Error ? err.message : err)
    }
    await sleep(DELAY_BETWEEN_SENDS_MS)
  }

  console.log(`Group ${group} done: ${sent} sent, ${failed} failed.`)
}

async function main() {
  const [command, arg] = process.argv.slice(2)
  const dryRun = process.argv.includes('--dry-run')

  if (command === 'assign') {
    await assignGroups()
    return
  }
  if (command === 'send') {
    const group = Number(arg)
    if (![1, 2, 3].includes(group)) throw new Error('Usage: send <1|2|3> [--dry-run]')
    await sendGroup(group, dryRun)
    return
  }
  throw new Error('Usage: assign | send <1|2|3> [--dry-run]')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
