import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isMvpBlockedDashboardRoute,
  resolveMvpDashboardPath,
} from '../lib/types/app.types'

/**
 * During MVP, `/dashboard` and `/dashboard/clients` are blocked and redirect to
 * `/dashboard/galleries`. The MVP bypass account (env `MVP_BYPASS_USER_ID`) —
 * the same account that gets private client galleries — sees the full
 * dashboard.
 */

const BYPASS_ID = 'bypass-user-0001'
const OTHER_ID = 'someone-else-0002'

function withBypassEnv(fn: () => void) {
  const saved = process.env.MVP_BYPASS_USER_ID
  try {
    process.env.MVP_BYPASS_USER_ID = BYPASS_ID
    fn()
  } finally {
    if (saved === undefined) delete process.env.MVP_BYPASS_USER_ID
    else process.env.MVP_BYPASS_USER_ID = saved
  }
}

test('blocks /dashboard and /dashboard/clients with no user', () => {
  assert.equal(isMvpBlockedDashboardRoute('/dashboard'), true)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/clients'), true)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/clients/123'), true)
})

test('never blocks other dashboard routes', () => {
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/galleries'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/settings'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/private-galleries'), false)
})

test('bypass account is not blocked; other accounts still are', () => {
  withBypassEnv(() => {
    assert.equal(isMvpBlockedDashboardRoute('/dashboard', BYPASS_ID), false)
    assert.equal(isMvpBlockedDashboardRoute('/dashboard/clients', BYPASS_ID), false)
    assert.equal(isMvpBlockedDashboardRoute('/dashboard', OTHER_ID), true)
    assert.equal(isMvpBlockedDashboardRoute('/dashboard', null), true)
  })
})

test('a blank / unset MVP_BYPASS_USER_ID never lifts the block', () => {
  const saved = process.env.MVP_BYPASS_USER_ID
  try {
    delete process.env.MVP_BYPASS_USER_ID
    assert.equal(isMvpBlockedDashboardRoute('/dashboard', BYPASS_ID), true)
    process.env.MVP_BYPASS_USER_ID = ''
    assert.equal(isMvpBlockedDashboardRoute('/dashboard', BYPASS_ID), true)
  } finally {
    if (saved === undefined) delete process.env.MVP_BYPASS_USER_ID
    else process.env.MVP_BYPASS_USER_ID = saved
  }
})

test('resolveMvpDashboardPath redirects blocked paths, keeps the rest', () => {
  assert.equal(resolveMvpDashboardPath('/dashboard'), '/dashboard/galleries')
  assert.equal(resolveMvpDashboardPath('/dashboard/clients'), '/dashboard/galleries')
  assert.equal(resolveMvpDashboardPath('/dashboard/posts'), '/dashboard/posts')
  assert.equal(resolveMvpDashboardPath('not-a-path'), '/dashboard/galleries')
})

test('resolveMvpDashboardPath keeps /dashboard for the bypass account', () => {
  withBypassEnv(() => {
    assert.equal(resolveMvpDashboardPath('/dashboard', BYPASS_ID), '/dashboard')
    assert.equal(resolveMvpDashboardPath('/dashboard', OTHER_ID), '/dashboard/galleries')
  })
})
