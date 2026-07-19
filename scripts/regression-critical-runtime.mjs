#!/usr/bin/env node
/**
 * Focused regression harness after Critical security fixes.
 * Creates two disposable tenants and exercises access / isolation / cleanup / email.
 *
 * Run: node scripts/regression-critical-runtime.mjs
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const runner = path.join(root, 'scripts', '_regression-critical-runner.ts')

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsx', runner],
  {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env },
  }
)

process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
process.exit(result.status ?? 1)
