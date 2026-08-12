const assert = require('assert').strict
const path = require('path')
const { pathToFileURL } = require('url')

const adminPath = path.resolve(__dirname, '../lib/supabase/admin.ts')
const adminUrl = pathToFileURL(adminPath).href

async function tryImportWithEnv(env) {
  const original = { ...process.env }
  try {
    Object.assign(process.env, env)
    // append timestamp to force a fresh import resolution in tsx
    const mod = await import(adminUrl + `?t=${Date.now()}`)
    if (typeof mod.createAdminClient === 'function') {
      // call to trigger env validation
      mod.createAdminClient()
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  } finally {
    // restore
    process.env = original
  }
}

(async () => {
  // 1. both present -> createAdminClient should succeed
  let r = await tryImportWithEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.com', SUPABASE_SERVICE_ROLE_KEY: 'key' })
  assert.equal(r.ok, true, `both envs present should load; ${r.message ?? ''}`)

  // 2. URL missing
  r = await tryImportWithEnv({ NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: 'key' })
  assert.equal(r.ok, false, `missing URL should fail`) 
  assert.match(r.message || '', /NEXT_PUBLIC_SUPABASE_URL is required/)

  // 3. key missing
  r = await tryImportWithEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.com', SUPABASE_SERVICE_ROLE_KEY: '' })
  assert.equal(r.ok, false, `missing key should fail`)
  assert.match(r.message || '', /SUPABASE_SERVICE_ROLE_KEY is required/)

  console.log('supabase-admin tests passed')
})().catch((e) => {
  console.error('supabase-admin tests failed', e)
  process.exit(1)
})
