#!/usr/bin/env node
/**
 * Unit checks for Critical security fixes (gallery access, R2 path ownership, email stubs).
 * Run: node scripts/test-security-critical.mjs
 */

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Pure helpers mirrored from lib/* for standalone Node tests (no TS loader).

function canonicalizeStorageKey(raw) {
  if (typeof raw !== 'string') return null
  let value = raw.trim()
  if (!value) return null
  try {
    value = decodeURIComponent(value)
  } catch {
    return null
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null
  value = value.replace(/\\/g, '/').replace(/\/+/g, '/')
  value = value.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!value || value.includes('\0')) return null
  const segments = value.split('/')
  if (segments.some((segment) => segment === '..' || segment === '.')) return null
  return value
}

function isOwnedStorageKey(rawPath, userId, resourcePrefix) {
  const key = canonicalizeStorageKey(rawPath)
  if (!key) return false
  const owner = canonicalizeStorageKey(userId)
  const resource = canonicalizeStorageKey(resourcePrefix)
  if (!owner || !resource) return false
  const expectedPrefix = `${owner}/${resource}/`
  return key.startsWith(expectedPrefix) && key.length > expectedPrefix.length
}

function resolveGalleryAccessMode({ isPublic, hasSessionForGallery }) {
  if (isPublic) return 'public'
  if (hasSessionForGallery) return 'session'
  return null
}

function maskEmailForLog(email) {
  if (!email) return null
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0 || at === trimmed.length - 1) return '***'
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const visible = local.slice(0, 1) || '*'
  return `${visible}***@${domain}`
}

const SECRET_KEYS = new Set([
  'password',
  'code',
  'otp',
  'token',
  'resetToken',
  'reset_token',
  'signedUrl',
  'signed_url',
  'authorization',
  'apiKey',
  'api_key',
])

function buildEmailStubLog(input) {
  const safeExtra = {}
  if (input.extra) {
    for (const [key, value] of Object.entries(input.extra)) {
      if (SECRET_KEYS.has(key)) continue
      if (value === undefined) continue
      safeExtra[key] = value
    }
  }
  return {
    template: input.template,
    emailHint: maskEmailForLog(input.email),
    resourceId: input.resourceId ?? null,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    ...safeExtra,
  }
}

function mustFailWithoutResend() {
  return process.env.NODE_ENV === 'production'
}

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    console.log(`PASS — ${label}`)
    passed++
  } else {
    console.log(`FAIL — ${label}`)
    failed++
  }
}

console.log('=== Gallery access ===\n')

check(
  'private gallery without session rejected',
  resolveGalleryAccessMode({ isPublic: false, hasSessionForGallery: false }) === null
)
check(
  'private gallery with other-gallery session rejected (session flag false)',
  resolveGalleryAccessMode({ isPublic: false, hasSessionForGallery: false }) === null
)
check(
  'private gallery with matching session allowed',
  resolveGalleryAccessMode({ isPublic: false, hasSessionForGallery: true }) === 'session'
)
check(
  'public gallery allowed without session',
  resolveGalleryAccessMode({ isPublic: true, hasSessionForGallery: false }) === 'public'
)
check(
  'getClientGallery signature has no skipSessionCheck param (source scan)',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/actions/client-gallery.actions.ts'), 'utf8')
    return (
      !src.includes('skipSessionCheck') &&
      /export async function getClientGallery\(galleryId: string\)/.test(src)
    )
  })()
)

console.log('\n=== Auth metadata exports ===\n')

check(
  'maybeSendWelcomeEmail not exported from auth.actions',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/actions/auth.actions.ts'), 'utf8')
    return !src.includes('export async function maybeSendWelcomeEmail')
  })()
)
check(
  'ensureUserProfile not exported from auth.actions (use server)',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/actions/auth.actions.ts'), 'utf8')
    return !src.includes('export async function ensureUserProfile')
  })()
)
check(
  'welcome helper uses getUser in user-profile module',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/auth/user-profile.ts'), 'utf8')
    const hasUseServerDirective = /^['"]use server['"]\s*;?/m.test(src)
    return (
      src.includes('maybeSendWelcomeEmailForCurrentUser') &&
      src.includes('.auth.getUser()') &&
      /updateUserById\(\s*user\.id/.test(src) &&
      !hasUseServerDirective
    )
  })()
)

console.log('\n=== R2 path ownership ===\n')

const userA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const userB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const galleryA = '11111111-1111-1111-1111-111111111111'
const galleryB = '22222222-2222-2222-2222-222222222222'

check(
  'owned path accepted',
  isOwnedStorageKey(`${userA}/${galleryA}/photo.jpg`, userA, galleryA)
)
check(
  'other user path rejected',
  !isOwnedStorageKey(`${userB}/${galleryB}/photo.jpg`, userA, galleryA)
)
check(
  'wrong gallery under same user rejected',
  !isOwnedStorageKey(`${userA}/${galleryB}/photo.jpg`, userA, galleryA)
)
check(
  '../ traversal rejected',
  !isOwnedStorageKey(`${userA}/${galleryA}/../${galleryB}/x.jpg`, userA, galleryA)
)
check(
  'URL-encoded traversal rejected',
  !isOwnedStorageKey(`${userA}/${galleryA}/%2e%2e/${galleryB}/x.jpg`, userA, galleryA)
)
check(
  'full URL rejected',
  !isOwnedStorageKey(`https://cdn.example.com/${userA}/${galleryA}/x.jpg`, userA, galleryA)
)
check(
  'backslash normalized then owned path accepted',
  isOwnedStorageKey(`${userA}\\${galleryA}\\preview.jpg`, userA, galleryA)
)
check(
  'cleanupPhotosBatch no longer accepts storagePaths arg',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/actions/photo.actions.ts'), 'utf8')
    return /export async function cleanupPhotosBatch\(\s*galleryId: string,\s*photoIds: string\[\]\s*\)/.test(
      src
    ) && !src.includes('storagePaths')
  })()
)
check(
  'cleanupPostPhotosBatch no longer accepts storagePaths arg',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/actions/post-photo.actions.ts'), 'utf8')
    return /export async function cleanupPostPhotosBatch\(\s*postId: string,\s*photoIds: string\[\]\s*\)/.test(
      src
    ) && !src.includes('storagePaths')
  })()
)

console.log('\n=== Email stub logging ===\n')

const stub = buildEmailStubLog({
  template: 'gallery-password',
  email: 'lena@example.com',
  resourceId: galleryA,
  extra: { password: 'secret123', code: '999999', note: 'ok' },
})

check('email masked in stub log', stub.emailHint === 'l***@example.com')
check('password stripped from stub log', !('password' in stub) && !JSON.stringify(stub).includes('secret123'))
check('otp/code stripped from stub log', !('code' in stub) && !JSON.stringify(stub).includes('999999'))
check('safe extra kept', stub.note === 'ok')

const prev = process.env.NODE_ENV
process.env.NODE_ENV = 'production'
check('production must fail without Resend', mustFailWithoutResend() === true)
process.env.NODE_ENV = 'development'
check('development may stub without Resend', mustFailWithoutResend() === false)
process.env.NODE_ENV = prev

check(
  'resend stubs never log raw input object',
  (() => {
    const fs = require('node:fs')
    const src = fs.readFileSync(path.join(root, 'lib/email/resend.ts'), 'utf8')
    return (
      !src.includes("console.info('[email stub]', input)") &&
      src.includes('buildEmailStubLog') &&
      src.includes('mustFailWithoutResend')
    )
  })()
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
