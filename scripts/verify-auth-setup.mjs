import { createClient } from '@supabase/supabase-js'
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
if (!url || !key) {
  console.log(JSON.stringify({ error: 'MISSING_SUPABASE_CREDS' }, null, 2))
  process.exit(1)
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const out = {}

const { data: admins, error: adminErr } = await sb
  .from('users')
  .select('auth_id, email')
  .eq('role', 'platform_admin')

out.platform_admin_count = adminErr ? -1 : (admins?.length ?? 0)
out.platform_admin_error = adminErr?.message ?? null
out.platform_admins_with_auth_id = admins?.filter((a) => a.auth_id).length ?? 0
out.platform_admins_missing_auth_id =
  admins?.filter((a) => !a.auth_id).length ?? 0

const { error: tokenErr } = await sb
  .from('password_reset_tokens')
  .select('id', { count: 'exact', head: true })

out.password_reset_tokens_exists = !tokenErr
out.password_reset_tokens_error = tokenErr?.message ?? null

const { data: photographers, error: photoErr } = await sb
  .from('photographers')
  .select('auth_user_id')

out.photographers_count = photoErr ? -1 : (photographers?.length ?? 0)
out.photographers_error = photoErr?.message ?? null
out.photographers_with_auth_user_id =
  photographers?.filter((p) => p.auth_user_id).length ?? 0
out.photographers_missing_auth_user_id =
  photographers?.filter((p) => !p.auth_user_id).length ?? 0

let linkedAuthOk = 0
let linkedAuthFail = 0
let authUserExistsForAdminEmail = false
let authIdWouldMatchEmailUser = false

const { data: authList, error: authListErr } = await sb.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})

if (admins?.length) {
  for (const admin of admins) {
    const adminEmail = admin.email?.trim().toLowerCase() ?? ''
    const emailAuthUser = authList?.users?.find(
      (u) => u.email?.trim().toLowerCase() === adminEmail
    )
    if (emailAuthUser) {
      authUserExistsForAdminEmail = true
      authIdWouldMatchEmailUser = admin.auth_id === emailAuthUser.id
    }

    if (!admin.auth_id) {
      linkedAuthFail++
      continue
    }
    const { data, error } = await sb.auth.admin.getUserById(admin.auth_id)
    if (!error && data?.user) linkedAuthOk++
    else {
      linkedAuthFail++
      out.platform_admin_auth_lookup_error = error?.message ?? 'user not found'
    }
  }
}

out.platform_admin_auth_links_ok = linkedAuthOk
out.platform_admin_auth_links_fail = linkedAuthFail
out.auth_list_error = authListErr?.message ?? null
out.auth_user_exists_for_platform_admin_email = authUserExistsForAdminEmail
out.platform_admin_auth_id_matches_email_auth_user = authIdWouldMatchEmailUser

let photographerAuthOk = 0
let photographerAuthFail = 0
if (photographers?.length) {
  for (const photographer of photographers) {
    if (!photographer.auth_user_id) {
      photographerAuthFail++
      continue
    }
    const { data, error } = await sb.auth.admin.getUserById(
      photographer.auth_user_id
    )
    if (!error && data?.user) photographerAuthOk++
    else photographerAuthFail++
  }
}
out.photographer_auth_links_ok = photographerAuthOk
out.photographer_auth_links_fail = photographerAuthFail

out.env = {
  RESEND_API_KEY: !!process.env.RESEND_API_KEY?.trim(),
  EMAIL_FROM: !!process.env.EMAIL_FROM?.trim(),
  NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  LEGACY_PLATFORM_ADMIN_EMAILS: !!process.env.PLATFORM_ADMIN_EMAILS?.trim(),
}

console.log(JSON.stringify(out, null, 2))
