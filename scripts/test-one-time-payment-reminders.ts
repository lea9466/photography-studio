import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  getOneTimePaymentReminderWindow,
  isOneTimePaymentEndInReminderWindow,
  isOneTimePaymentRemindersEnabled,
  processOneTimePaymentReminders,
  runOneTimePaymentReminders,
  type OneTimePaymentReminderCandidate,
  type OneTimePaymentReminderDeps,
} from '../lib/subscriptions/one-time-payment-reminders.ts'
import {
  isOneTimePaymentExpiredEmailEnabled,
  processOneTimePaymentExpiredNotifications,
  runOneTimePaymentExpiredNotifications,
  type OneTimePaymentExpiredCandidate,
  type OneTimePaymentExpiredDeps,
} from '../lib/subscriptions/one-time-payment-expired-notifications.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function utcDate(year: number, month: number, day: number, hour = 12) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0))
}

function reminderCandidate(
  overrides: Partial<OneTimePaymentReminderCandidate> = {}
): OneTimePaymentReminderCandidate {
  return {
    id: 'sub-1',
    userId: 'user-1',
    email: 'owner@example.com',
    name: 'לאה',
    slug: 'lea-studio',
    current_period_end: utcDate(2026, 8, 9).toISOString(),
    ...overrides,
  }
}

function expiredCandidate(
  overrides: Partial<OneTimePaymentExpiredCandidate> = {}
): OneTimePaymentExpiredCandidate {
  return {
    id: 'sub-1',
    userId: 'user-1',
    email: 'owner@example.com',
    name: 'לאה',
    slug: 'lea-studio',
    ...overrides,
  }
}

function createReminderDeps(options?: {
  candidates?: OneTimePaymentReminderCandidate[]
  failSend?: boolean
  alreadyClaimed?: Set<string>
  now?: Date
}): OneTimePaymentReminderDeps & {
  sent: Array<{ email: string }>
  claims: Map<string, string | null>
  releaseCalls: Array<{ subscriptionId: string; claimedAt: string }>
} {
  const claims = new Map<string, string | null>()
  const alreadyClaimed = options?.alreadyClaimed ?? new Set<string>()
  const sent: Array<{ email: string }> = []
  const releaseCalls: Array<{ subscriptionId: string; claimedAt: string }> = []

  return {
    sent,
    claims,
    releaseCalls,
    now: () => options?.now ?? utcDate(2026, 8, 6, 8),
    async listCandidates(window) {
      if (options?.candidates) return options.candidates
      return [reminderCandidate()].filter((row) => {
        const end = new Date(row.current_period_end).getTime()
        return end >= window.windowStart.getTime() && end < window.windowEnd.getTime()
      })
    },
    async claimReminder(subscriptionId) {
      if (alreadyClaimed.has(subscriptionId) || claims.get(subscriptionId)) return null
      const claimedAt = `claim-${subscriptionId}-${claims.size + 1}`
      claims.set(subscriptionId, claimedAt)
      return claimedAt
    },
    async releaseClaim(subscriptionId, claimedAt) {
      releaseCalls.push({ subscriptionId, claimedAt })
      if (claims.get(subscriptionId) === claimedAt) claims.set(subscriptionId, null)
    },
    async sendReminder(input) {
      if (options?.failSend) throw new Error('ResendUnavailable')
      sent.push({ email: input.email })
    },
  }
}

test('reminder window is UTC day+3 inclusive to day+4 exclusive', () => {
  const now = utcDate(2026, 8, 6, 15)
  const window = getOneTimePaymentReminderWindow(now)
  assert.equal(window.windowStart.toISOString(), '2026-08-09T00:00:00.000Z')
  assert.equal(window.windowEnd.toISOString(), '2026-08-10T00:00:00.000Z')

  assert.equal(isOneTimePaymentEndInReminderWindow(utcDate(2026, 8, 9, 0), now), true)
  assert.equal(isOneTimePaymentEndInReminderWindow(utcDate(2026, 8, 8, 12), now), false)
  assert.equal(isOneTimePaymentEndInReminderWindow(utcDate(2026, 8, 10, 0), now), false)
})

test('one-time reminder flags require exact true', () => {
  const previous = process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED
  try {
    delete process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED
    assert.equal(isOneTimePaymentRemindersEnabled(), false)
    process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED = 'TRUE'
    assert.equal(isOneTimePaymentRemindersEnabled(), false)
    process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED = 'true'
    assert.equal(isOneTimePaymentRemindersEnabled(), true)
  } finally {
    if (previous === undefined) delete process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED
    else process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED = previous
  }

  const previousExpired = process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED
  try {
    delete process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED
    assert.equal(isOneTimePaymentExpiredEmailEnabled(), false)
    process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED = 'true'
    assert.equal(isOneTimePaymentExpiredEmailEnabled(), true)
  } finally {
    if (previousExpired === undefined) delete process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED
    else process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED = previousExpired
  }
})

test('disabled reminders/expiry jobs skip DB writes and email with zero summary', async () => {
  const previous = process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED
  process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED = 'false'
  try {
    const summary = await runOneTimePaymentReminders()
    assert.deepEqual(summary, {
      enabled: false,
      status: 'disabled',
      candidates: 0,
      claimed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    })
  } finally {
    if (previous === undefined) delete process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED
    else process.env.ONE_TIME_PAYMENT_REMINDERS_ENABLED = previous
  }

  const previousExpired = process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED
  process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED = 'false'
  try {
    const summary = await runOneTimePaymentExpiredNotifications()
    assert.deepEqual(summary, {
      enabled: false,
      status: 'disabled',
      candidates: 0,
      claimed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    })
  } finally {
    if (previousExpired === undefined) delete process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED
    else process.env.ONE_TIME_PAYMENT_EXPIRED_EMAIL_ENABLED = previousExpired
  }
})

test('subscription with 3 days left receives the reminder once', async () => {
  const deps = createReminderDeps({
    candidates: [reminderCandidate({ current_period_end: utcDate(2026, 8, 9).toISOString() })],
  })
  const summary = await processOneTimePaymentReminders(deps)

  assert.equal(summary.candidates, 1)
  assert.equal(summary.claimed, 1)
  assert.equal(summary.sent, 1)
  assert.deepEqual(deps.sent, [{ email: 'owner@example.com' }])
  assert.ok(deps.claims.get('sub-1'))
})

test('subscription already claimed is skipped', async () => {
  const deps = createReminderDeps({ alreadyClaimed: new Set(['sub-1']) })
  const summary = await processOneTimePaymentReminders(deps)

  assert.equal(summary.sent, 0)
  assert.equal(summary.skipped, 1)
  assert.equal(deps.sent.length, 0)
})

test('two overlapping cron runs send only once', async () => {
  const sharedClaims = new Map<string, string | null>()
  const sent: Array<{ email: string }> = []

  const makeDeps = (): OneTimePaymentReminderDeps => ({
    now: () => utcDate(2026, 8, 6),
    async listCandidates() {
      return [reminderCandidate()]
    },
    async claimReminder(subscriptionId) {
      if (sharedClaims.get(subscriptionId)) return null
      const claimedAt = 'shared-claim-1'
      sharedClaims.set(subscriptionId, claimedAt)
      return claimedAt
    },
    async releaseClaim(subscriptionId, claimedAt) {
      if (sharedClaims.get(subscriptionId) === claimedAt) sharedClaims.set(subscriptionId, null)
    },
    async sendReminder(input) {
      sent.push({ email: input.email })
    },
  })

  const first = await processOneTimePaymentReminders(makeDeps())
  const second = await processOneTimePaymentReminders(makeDeps())

  assert.equal(first.sent, 1)
  assert.equal(second.sent, 0)
  assert.equal(second.skipped, 1)
  assert.equal(sent.length, 1)
})

test('Resend failure releases only the matching claim timestamp', async () => {
  const deps = createReminderDeps({ failSend: true })
  const summary = await processOneTimePaymentReminders(deps)

  assert.equal(summary.failed, 1)
  assert.equal(summary.sent, 0)
  assert.equal(deps.claims.get('sub-1'), null)
  assert.equal(deps.releaseCalls.length, 1)
  assert.match(deps.releaseCalls[0]?.claimedAt ?? '', /^claim-sub-1-/)
})

test('expired-notification job sends once per subscription and dedupes overlapping runs', async () => {
  const claims = new Map<string, string | null>()
  const sent: Array<{ email: string }> = []

  const makeDeps = (): OneTimePaymentExpiredDeps => ({
    now: () => utcDate(2026, 8, 12),
    async listCandidates() {
      return [expiredCandidate()]
    },
    async claimNotification(subscriptionId) {
      if (claims.get(subscriptionId)) return null
      const claimedAt = 'shared-claim-1'
      claims.set(subscriptionId, claimedAt)
      return claimedAt
    },
    async releaseClaim(subscriptionId, claimedAt) {
      if (claims.get(subscriptionId) === claimedAt) claims.set(subscriptionId, null)
    },
    async sendNotification(input) {
      sent.push({ email: input.email })
    },
  })

  const first = await processOneTimePaymentExpiredNotifications(makeDeps())
  const second = await processOneTimePaymentExpiredNotifications(makeDeps())

  assert.equal(first.sent, 1)
  assert.equal(second.sent, 0)
  assert.equal(second.skipped, 1)
  assert.equal(sent.length, 1)
})

test('one-time payment code stays wired: emails, provider, cron, migration, UI', async () => {
  const emailSource = await readFile(path.join(root, 'lib/email/resend.ts'), 'utf8')
  assert.match(emailSource, /sendOneTimePlanEndingReminderEmail/)
  assert.match(emailSource, /sendOneTimePlanExpiredEmail/)
  assert.match(emailSource, /עוד 3 ימים והחשבון שלך חוזר למסלול החינמי/)

  const cronSource = await readFile(
    path.join(root, 'app/api/cron/trial-ending-reminders/route.ts'),
    'utf8'
  )
  assert.match(cronSource, /runOneTimePaymentReminders/)
  assert.match(cronSource, /runOneTimePaymentExpiredNotifications/)
  assert.match(cronSource, /authorizeCronRequest/)

  const providerSource = await readFile(
    path.join(root, 'lib/payments/providers/sumit/sumit-provider.ts'),
    'utf8'
  )
  assert.match(providerSource, /createOneTimeCheckoutSession/)
  assert.match(providerSource, /completeOneTimeCheckout/)
  assert.match(providerSource, /AuthoriseOnly: 'false'/)

  const returnRouteSource = await readFile(
    path.join(root, 'app/api/payments/webhooks/sumit/return/route.ts'),
    'utf8'
  )
  assert.match(returnRouteSource, /one_time_checkout/)
  assert.match(returnRouteSource, /handleOneTimeCheckout/)

  const checkoutRouteSource = await readFile(
    path.join(root, 'app/api/payments/checkout/route.ts'),
    'utf8'
  )
  assert.match(checkoutRouteSource, /isOneTimePaymentEnabled/)
  assert.match(checkoutRouteSource, /createOneTimeCheckout/)

  const panelSource = await readFile(
    path.join(root, 'components/dashboard/SubscriptionBillingPanel.tsx'),
    'utf8'
  )
  assert.match(panelSource, /oneTimePaymentEnabled/)
  assert.match(panelSource, /paymentType: 'one_time'/)

  const migrationSource = await readFile(
    path.join(
      root,
      'supabase/migrations/20260824000000_add_one_time_payment_support.sql'
    ),
    'utf8'
  )
  assert.match(migrationSource, /^begin;/m)
  assert.match(migrationSource, /^commit;/m)
  assert.match(migrationSource, /add column if not exists payment_type text/)
  assert.match(migrationSource, /add column if not exists one_time_reminder_sent_at timestamptz/)
  assert.match(
    migrationSource,
    /add column if not exists one_time_expired_email_sent_at timestamptz/
  )
  assert.doesNotMatch(migrationSource, /drop |delete /)
})
