#!/usr/bin/env node
/**
 * Verifies that a single-statement atomic UPSERT rate-limit check cannot be
 * bypassed by two concurrent requests on the same key — unlike a naive
 * "read the count, decide, then write" approach split across two separate
 * round trips (exactly what the app-side code this migration replaces used
 * to do, and exactly what two concurrent Vercel serverless invocations
 * hitting Postgres over the network look like).
 *
 * This uses SQLite (via node:sqlite) as a stand-in SQL engine purely to
 * exercise a real INSERT ... ON CONFLICT ... DO UPDATE ... WHERE ...
 * RETURNING statement — the same UPSERT primitive
 * admin_rate_limit_check() in supabase/migrations/20250713000001_add_admin_rate_limits.sql
 * relies on. It does NOT touch the real Supabase project, and it is not a
 * substitute for testing the actual deployed Postgres function.
 *
 * Run: node scripts/test-rate-limit-concurrency.mjs
 */

import { DatabaseSync } from 'node:sqlite'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function freshDb() {
  const db = new DatabaseSync(':memory:')
  db.exec(`
    CREATE TABLE rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )
  `)
  return db
}

// --- NAIVE (racy): separate read, then separate write ---------------------
// This is the "count-then-insert בצד האפליקציה" anti-pattern the fix
// replaces. `networkDelayMs` simulates the real round-trip latency between
// an app server and the DB that exists between the SELECT and the
// follow-up write when the *application* — not the database — makes the
// allow/deny decision.
async function naiveCheck(db, key, maxAttempts, windowMs, networkDelayMs) {
  const now = Date.now()
  const row = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key)

  await delay(networkDelayMs) // <-- the race window: both callers can land here
  // having read the same "not yet at limit" state before either one writes.

  if (!row || row.reset_at <= now) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`
    ).run(key, now + windowMs)
    return { allowed: true }
  }

  if (row.count >= maxAttempts) {
    return { allowed: false }
  }

  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key)
  return { allowed: true }
}

// --- ATOMIC (fixed): single UPSERT statement, decision made BY the DB -----
// Structurally the same statement as admin_rate_limit_check(): one
// INSERT ... ON CONFLICT ... DO UPDATE ... WHERE ... RETURNING. No
// app-level read-then-write gap exists for a race to fall into.
function atomicCheck(db, key, maxAttempts, windowMs) {
  const now = Date.now()
  const row = db
    .prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
         reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END
       WHERE reset_at <= ? OR count < ?
       RETURNING count`
    )
    .get(key, now + windowMs, now, now, now + windowMs, now, maxAttempts)

  return { allowed: Boolean(row) }
}

let passed = 0
let failed = 0

function report(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`)
  if (detail) console.log(`   ${detail}`)
  if (ok) passed++
  else failed++
}

async function main() {
  const maxAttempts = 1 // easiest limit to prove a bypass against
  const windowMs = 60_000

  // --- Demonstrate the bug in the naive approach --------------------------
  {
    const db = freshDb()
    const key = 'naive-key'
    const [r1, r2] = await Promise.all([
      naiveCheck(db, key, maxAttempts, windowMs, 20),
      naiveCheck(db, key, maxAttempts, windowMs, 20),
    ])
    const allowedCount = [r1, r2].filter((r) => r.allowed).length
    report(
      'Naive read-then-write DOES let 2 concurrent requests both succeed under limit=1 (expected bug)',
      allowedCount === 2,
      `results: ${JSON.stringify([r1, r2])} — both "allowed:true" means the limit was bypassed`
    )
  }

  // --- Prove the atomic UPSERT closes that gap -----------------------------
  {
    const db = freshDb()
    const key = 'atomic-key'
    const [r1, r2] = await Promise.all([
      Promise.resolve(atomicCheck(db, key, maxAttempts, windowMs)),
      Promise.resolve(atomicCheck(db, key, maxAttempts, windowMs)),
    ])
    const allowedCount = [r1, r2].filter((r) => r.allowed).length
    report(
      'Atomic UPSERT only lets 1 of 2 concurrent requests succeed under limit=1',
      allowedCount === 1,
      `results: ${JSON.stringify([r1, r2])} — exactly one "allowed:true" expected`
    )
  }

  // --- Higher-concurrency stress check (limit=3, 10 concurrent callers) ---
  {
    const db = freshDb()
    const key = 'atomic-key-stress'
    const results = await Promise.all(
      Array.from({ length: 10 }, () => Promise.resolve(atomicCheck(db, key, 3, windowMs)))
    )
    const allowedCount = results.filter((r) => r.allowed).length
    report(
      'Atomic UPSERT allows EXACTLY 3 of 10 concurrent requests under limit=3',
      allowedCount === 3,
      `allowed: ${allowedCount}/10`
    )
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
