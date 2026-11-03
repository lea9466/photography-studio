/**
 * One-time rollout of the "how private galleries work" video email
 * (buildPrivateGalleriesVideoEmail), split into 3 groups (one group per day)
 * to stay under the sending provider's ~100/day quota. Same bookkeeping model
 * as send-hero-design-announcement.ts: state lives in a git-tracked JSON file
 * next to this script (user IDs + group numbers + sent timestamps only), and
 * the email/name is re-fetched fresh from the DB at send time.
 *
 * Audience: studios with an email address that have NOT created a private
 * (client) gallery yet, marketing opt-outs and the owner account excluded.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/send-private-galleries-video-email.ts assign
 *   npx tsx --env-file=.env.local scripts/send-private-galleries-video-email.ts send <1|2|3> [--dry-run]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createAdminClient } from '../lib/supabase/admin.ts'
import { sendPrivateGalleriesVideoEmail } from '../lib/email/resend.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_PATH = join(__dirname, 'data', 'private-galleries-video-email-state.json')

type StudioState = { group: 1 | 2 | 3; sentAt: string | null }
type State = { assignedAt: string; studios: Record<string, StudioState> }

const DELAY_BETWEEN_SENDS_MS = 700

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadState(): State | null {
  if (!existsSync(STATE_PATH)) return null
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as State
}

function saveState(state: State) {
  mkdirSync(dirname(STATE_PATH), { recursive: true })
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8')
}

async function assignGroups() {
  const existing = loadState()
  if (existing) {
    console.log(`Already assigned on ${existing.assignedAt} — not reassigning.`)
    printGroupCounts(existing)
    return
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, created_at')
    .is('marketing_emails_opted_out_at', null) // asked to be taken off the list
    .order('created_at', { ascending: true })
  if (error) throw error

  const rows = (data ?? []) as { id: string; email: string | null; created_at: string }[]

  // Studios that already created a private (client) gallery don't need the
  // explainer — every non-portfolio gallery is a client gallery (lib/gallery-kind.ts).
  const { data: clientGalleries, error: galleriesError } = await admin
    .from('galleries')
    .select('user_id')
    .neq('gallery_type', 'portfolio')
  if (galleriesError) throw galleriesError
  const hasPrivateGallery = new Set(
    ((clientGalleries ?? []) as { user_id: string }[]).map((g) => g.user_id)
  )

  // Lea's own account (studio owner, not a customer) — never part of the
  // announcement rollout.
  const eligible = rows.filter(
    (r) =>
      r.email &&
      r.email.trim() &&
      r.email.trim() !== 'lea0556769466@gmail.com' &&
      !hasPrivateGallery.has(r.id)
  )

  const groupSize = Math.ceil(eligible.length / 3)
  const studios: Record<string, StudioState> = {}
  eligible.forEach((row, i) => {
    const group = Math.min(3, Math.floor(i / groupSize) + 1) as 1 | 2 | 3
    studios[row.id] = { group, sentAt: null }
  })

  const state: State = { assignedAt: new Date().toISOString(), studios }
  saveState(state)

  console.log(`Assigned ${eligible.length} studio(s) into 3 groups (oldest -> group 1, newest -> group 3).`)
  console.log(`Excluded (no email / owner account / already has a private gallery): ${rows.length - eligible.length}`)
  printGroupCounts(state)
  console.log(`\nState written to ${STATE_PATH} — commit this file to git.`)
}

function printGroupCounts(state: State) {
  for (const g of [1, 2, 3] as const) {
    const count = Object.values(state.studios).filter((s) => s.group === g).length
    const sent = Object.values(state.studios).filter((s) => s.group === g && s.sentAt).length
    console.log(`  group ${g}: ${count} (${sent} already sent)`)
  }
}

async function sendGroup(group: 1 | 2 | 3, dryRun: boolean) {
  const state = loadState()
  if (!state) throw new Error('No state file — run "assign" first.')

  const pendingIds = Object.entries(state.studios)
    .filter(([, s]) => s.group === group && !s.sentAt)
    .map(([id]) => id)

  console.log(`Group ${group}: ${pendingIds.length} studio(s) pending (not yet sent).`)
  if (pendingIds.length === 0) return

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, studio_name')
    .is('marketing_emails_opted_out_at', null) // asked to be taken off the list
    .in('id', pendingIds)
  if (error) throw error

  const rows = (data ?? []) as {
    id: string
    email: string | null
    name: string | null
    studio_name: string | null
  }[]

  if (dryRun) {
    for (const row of rows)
      console.log(`  [dry-run] would send to ${row.email} (${row.studio_name ?? row.name ?? 'no name'})`)
    return
  }

  let sent = 0
  let failed = 0
  for (const row of rows) {
    if (!row.email) continue
    try {
      await sendPrivateGalleriesVideoEmail({
        name: row.name?.trim() || row.studio_name?.trim() || 'שלום',
        email: row.email,
      })
      state.studios[row.id].sentAt = new Date().toISOString()
      saveState(state)
      sent++
      console.log(`  sent to ${row.email}`)
    } catch (err) {
      failed++
      console.error(
        `  FAILED to send to ${row.email} — will retry on next run:`,
        err instanceof Error ? err.message : err
      )
    }
    await sleep(DELAY_BETWEEN_SENDS_MS)
  }

  console.log(`Group ${group} done: ${sent} sent, ${failed} failed.`)
  console.log(`State updated at ${STATE_PATH} — commit this file to git.`)
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
    await sendGroup(group as 1 | 2 | 3, dryRun)
    return
  }
  throw new Error('Usage: assign | send <1|2|3> [--dry-run]')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
