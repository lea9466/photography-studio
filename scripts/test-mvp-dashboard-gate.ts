import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CLIENT_GALLERIES_ENABLED,
  isMvpBlockedDashboardRoute,
  resolveMvpDashboardPath,
} from '../lib/types/app.types'

/**
 * The private client-gallery workspace (dashboard overview + clients CRM +
 * private galleries) is open to every account — `CLIENT_GALLERIES_ENABLED`.
 * `isMvpBlockedDashboardRoute` blocks nothing, and `resolveMvpDashboardPath`
 * only normalizes a non-path string to the default landing page.
 */

test('the client-gallery workspace flag is on', () => {
  assert.equal(CLIENT_GALLERIES_ENABLED, true)
})

test('no dashboard route is blocked', () => {
  assert.equal(isMvpBlockedDashboardRoute('/dashboard'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/clients'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/clients/123'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard/galleries'), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard', null), false)
  assert.equal(isMvpBlockedDashboardRoute('/dashboard', 'any-user-id'), false)
})

test('resolveMvpDashboardPath passes real paths through, normalizes the rest', () => {
  assert.equal(resolveMvpDashboardPath('/dashboard'), '/dashboard')
  assert.equal(resolveMvpDashboardPath('/dashboard/clients'), '/dashboard/clients')
  assert.equal(resolveMvpDashboardPath('/dashboard/posts'), '/dashboard/posts')
  assert.equal(resolveMvpDashboardPath('not-a-path'), '/dashboard/galleries')
})
