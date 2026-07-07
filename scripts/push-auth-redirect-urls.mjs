#!/usr/bin/env node

/**
 * Updates Supabase Auth redirect URLs via Management API.
 * Requires SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... node scripts/push-auth-redirect-urls.mjs
 */

const PROJECT_REF = 'plcdiaufvczwaiojuxgo'
const SITE_URL = 'https://studio-galleries.com'
const REQUIRED_REDIRECTS = [
  'https://studio-galleries.com/**',
  'http://localhost:3000/**',
  'http://127.0.0.1:3000/**',
]

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
if (!token) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens'
  )
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

function parseAllowList(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function serializeAllowList(urls) {
  return [...new Set(urls)].join(',')
}

async function main() {
  const getRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers }
  )

  if (!getRes.ok) {
    const body = await getRes.text()
    throw new Error(`GET auth config failed (${getRes.status}): ${body}`)
  }

  const current = await getRes.json()
  const mergedAllowList = serializeAllowList([
    ...parseAllowList(current.uri_allow_list),
    ...REQUIRED_REDIRECTS,
  ])

  const patchRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        site_url: SITE_URL,
        uri_allow_list: mergedAllowList,
      }),
    }
  )

  if (!patchRes.ok) {
    const body = await patchRes.text()
    throw new Error(`PATCH auth config failed (${patchRes.status}): ${body}`)
  }

  const updated = await patchRes.json()
  console.log('Auth redirect URLs updated successfully.')
  console.log(`site_url: ${updated.site_url}`)
  console.log(`uri_allow_list: ${updated.uri_allow_list}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
