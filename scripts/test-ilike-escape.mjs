#!/usr/bin/env node
// --experimental-sqlite may be required on some Node versions.

/**
 * Standalone verification for escapeIlikePattern() in lib/actions/admin.actions.ts.
 *
 * This is NOT wired into the app or into any test runner (the project has none
 * configured) — it's a throwaway script that proves the escaping behaves
 * correctly against a REAL SQL engine's LIKE/ESCAPE implementation (SQLite),
 * which follows the same standard-SQL escaping semantics Postgres ILIKE uses
 * (backslash as escape char, '%' = any run of chars, '_' = any single char).
 *
 * Run: node scripts/test-ilike-escape.mjs
 */

import { DatabaseSync } from 'node:sqlite'

// Exact copy of the implementation in lib/actions/admin.actions.ts (line ~63).
// Duplicated here on purpose — that file has 'use server' and only exports
// async functions, so this local helper can't be imported directly.
function escapeIlikePattern(value) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

const db = new DatabaseSync(':memory:')
db.exec('CREATE TABLE users (email TEXT)')

const seed = db.prepare('INSERT INTO users (email) VALUES (?)')
;[
  'axxb@example.com', // would falsely match unescaped "a%b" pattern
  'axb@example.com', // would falsely match unescaped "a_b" pattern
  'a%b@example.com', // literal record containing a real percent sign
  'a_b@example.com', // literal record containing a real underscore
  String.raw`a\b@example.com`, // literal record containing a real backslash
].forEach((email) => seed.run(email))

// SQLite LIKE is ASCII case-insensitive by default, mirroring Postgres ILIKE.
const query = db.prepare("SELECT email FROM users WHERE email LIKE ? ESCAPE '\\'")

let passed = 0
let failed = 0

function check(label, pattern, expectedMatches) {
  const rows = query.all(pattern).map((r) => r.email)
  const rowsSorted = [...rows].sort()
  const expectedSorted = [...expectedMatches].sort()
  const ok = JSON.stringify(rowsSorted) === JSON.stringify(expectedSorted)

  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`)
  console.log(`   pattern sent to LIKE: ${JSON.stringify(pattern)}`)
  console.log(`   matched rows:         ${JSON.stringify(rows)}`)
  console.log(`   expected rows:        ${JSON.stringify(expectedMatches)}`)

  if (ok) passed++
  else failed++
}

console.log('--- BEFORE FIX: raw user input used directly as LIKE pattern (vulnerable) ---\n')

check(
  'Unescaped "a%b@example.com" wildcard-matches EVERY row (% = any run of chars)',
  'a%b@example.com', // user types this expecting an exact-match check
  [
    'axxb@example.com',
    'axb@example.com',
    'a%b@example.com',
    'a_b@example.com',
    String.raw`a\b@example.com`,
  ]
)

check(
  'Unescaped "a_b@example.com" wildcard-matches every row with exactly 1 char in the middle (_ = any single char)',
  'a_b@example.com',
  ['axb@example.com', 'a%b@example.com', 'a_b@example.com', String.raw`a\b@example.com`]
)

console.log('\n--- AFTER FIX: escapeIlikePattern() applied before the query ---\n')

check(
  '1) "a%b@example.com" only matches the literal "%" row, NOT "axxb@example.com"',
  escapeIlikePattern('a%b@example.com'),
  ['a%b@example.com']
)

check(
  '2) "a_b@example.com" only matches the literal "_" row, NOT "axb@example.com"',
  escapeIlikePattern('a_b@example.com'),
  ['a_b@example.com']
)

check(
  '3) A literal backslash in the input matches only the literal backslash row, no SQL error, no wildcard side effects',
  escapeIlikePattern(String.raw`a\b@example.com`),
  [String.raw`a\b@example.com`]
)

check(
  '4) Case-insensitive matching (ILIKE behavior) is preserved after escaping',
  escapeIlikePattern('A%B@EXAMPLE.COM'),
  ['a%b@example.com']
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
