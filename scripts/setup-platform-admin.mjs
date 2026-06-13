/**
 * יוצר/מסנכרן משתמש Supabase Auth למנהל פלטפורמה ומקשר ל-users.
 * דורש ב-.env.local: PLATFORM_ADMIN_EMAILS, PLATFORM_ADMIN_PASSWORD
 * (או ערכים חלופיים: PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASS)
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = (
  process.env.PLATFORM_ADMIN_EMAIL ??
  process.env.PLATFORM_ADMIN_EMAILS?.split(',')[0] ??
  ''
).trim()
const password = (
  process.env.PLATFORM_ADMIN_PASSWORD ??
  process.env.PLATFORM_ADMIN_PASS ??
  ''
).trim()

if (!url || !key) {
  console.error('חסרים NEXT_PUBLIC_SUPABASE_URL או SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!email || !password) {
  console.error(
    'חסרים PLATFORM_ADMIN_EMAILS ו-PLATFORM_ADMIN_PASSWORD ב-.env.local'
  )
  process.exit(1)
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const normalizedEmail = email.toLowerCase()

let authUserId = null

const { data: existingRow } = await sb
  .from('users')
  .select('id, auth_id')
  .ilike('email', normalizedEmail)
  .eq('role', 'platform_admin')
  .maybeSingle()

if (existingRow?.auth_id) {
  const { data: linked, error: linkedErr } = await sb.auth.admin.getUserById(
    existingRow.auth_id
  )
  if (!linkedErr && linked?.user) {
    authUserId = linked.user.id
    console.log('משתמש Auth קיים — מקושר:', authUserId.slice(0, 8) + '...')
  }
}

if (!authUserId) {
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  })

  if (createErr) {
    console.error('יצירת משתמש Auth נכשלה:', createErr.message)
    process.exit(1)
  }

  authUserId = created.user.id
  console.log('נוצר משתמש Auth חדש:', authUserId.slice(0, 8) + '...')
}

if (existingRow) {
  const { error: updateErr } = await sb
    .from('users')
    .update({ auth_id: authUserId, email: normalizedEmail, role: 'platform_admin' })
    .eq('id', existingRow.id)

  if (updateErr) {
    console.error('עדכון users נכשל:', updateErr.message)
    process.exit(1)
  }
  console.log('עודכנה שורת platform_admin ב-users')
} else {
  const { error: insertErr } = await sb.from('users').insert({
    id: randomUUID(),
    auth_id: authUserId,
    email: normalizedEmail,
    role: 'platform_admin',
  })

  if (insertErr) {
    console.error('יצירת שורת users נכשלה:', insertErr.message)
    process.exit(1)
  }
  console.log('נוצרה שורת platform_admin ב-users')
}

console.log('הושלם — אפשר להתחבר ב-/platform/login')
