/**
 * One-time backfill: mark every existing Supabase Auth user with
 * `user_metadata.welcome_email_sent = true`.
 *
 * Why: the auth callback (app/auth/callback/route.ts) calls
 * maybeSendWelcomeEmailForCurrentUser on EVERY code exchange — OAuth login,
 * magic link, password reset — guarded only by that flag. Users who registered
 * before the flag existed (2026-07-10) would otherwise receive a "welcome"
 * email the next time they log in. This closes that gap for the whole existing
 * population; the age guard in user-profile.ts covers anyone missed.
 *
 * Usage:
 *   node scripts/backfill-welcome-email-sent.mjs            # dry run (default)
 *   node scripts/backfill-welcome-email-sent.mjs --apply    # actually write
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const PER_PAGE = 1000

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let page = 1
let total = 0
let alreadySet = 0
let updated = 0
let failed = 0

for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
  if (error) {
    console.error('listUsers failed on page', page, error.message)
    process.exit(1)
  }

  const users = data?.users ?? []
  if (users.length === 0) break

  for (const user of users) {
    total += 1
    const metadata = user.user_metadata ?? {}
    if (metadata.welcome_email_sent === true) {
      alreadySet += 1
      continue
    }

    if (!APPLY) {
      updated += 1
      console.log(`[dry-run] would mark ${user.email ?? user.id} (created ${user.created_at})`)
      continue
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...metadata, welcome_email_sent: true },
    })
    if (updateError) {
      failed += 1
      console.error(`  FAILED ${user.email ?? user.id}: ${updateError.message}`)
    } else {
      updated += 1
      console.log(`  marked ${user.email ?? user.id}`)
    }
  }

  if (users.length < PER_PAGE) break
  page += 1
}

console.log('\n---')
console.log(`mode:          ${APPLY ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`)
console.log(`total users:   ${total}`)
console.log(`already set:   ${alreadySet}`)
console.log(`${APPLY ? 'updated' : 'would update'}: ${updated}`)
if (failed) console.log(`failed:        ${failed}`)
