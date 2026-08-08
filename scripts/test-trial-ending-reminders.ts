import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { authorizeCronRequest } from '../lib/cron/authorize.ts'
import {
  evaluateStudioAccess,
  isSubscriptionEnforcementEnabled,
} from '../lib/payments/access.ts'
import { isPaymentsCheckoutEnabled } from '../lib/payments/flags.ts'
import {
  getTrialEndingReminderWindow,
  getTrialReminderMode,
  isTrialEndingRemindersEnabled,
  isTrialEndInReminderWindow,
  processTrialEndingReminders,
  runTrialEndingReminders,
  type TrialEndingReminderCandidate,
  type TrialEndingReminderDeps,
  type TrialReminderMode,
} from '../lib/trial/trial-ending-reminders.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function utcDate(year: number, month: number, day: number, hour = 12) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0))
}

function candidate(
  overrides: Partial<TrialEndingReminderCandidate> = {}
): TrialEndingReminderCandidate {
  return {
    id: 'user-1',
    email: 'owner@example.com',
    name: 'לאה',
    trial_end_date: utcDate(2026, 8, 9).toISOString(),
    ...overrides,
  }
}

function createDeps(options?: {
  mode?: TrialReminderMode
  candidates?: TrialEndingReminderCandidate[]
  activeUserIds?: Set<string>
  failSend?: boolean
  alreadyClaimed?: Set<string>
  now?: Date
}): TrialEndingReminderDeps & {
  sent: Array<{ email: string; mode: TrialReminderMode }>
  claims: Map<string, string | null>
  releaseCalls: Array<{ userId: string; claimedAt: string }>
  listedWindows: Array<{ start: string; end: string }>
} {
  const claims = new Map<string, string | null>()
  const activeUserIds = options?.activeUserIds ?? new Set<string>()
  const alreadyClaimed = options?.alreadyClaimed ?? new Set<string>()
  const sent: Array<{ email: string; mode: TrialReminderMode }> = []
  const releaseCalls: Array<{ userId: string; claimedAt: string }> = []
  const listedWindows: Array<{ start: string; end: string }> = []
  const mode = options?.mode ?? 'update'

  return {
    mode,
    sent,
    claims,
    releaseCalls,
    listedWindows,
    now: () => options?.now ?? utcDate(2026, 8, 6, 8),
    async listCandidates(window) {
      listedWindows.push({
        start: window.windowStart.toISOString(),
        end: window.windowEnd.toISOString(),
      })
      if (options?.candidates) return options.candidates
      return [candidate()].filter((row) => {
        const end = new Date(row.trial_end_date).getTime()
        return (
          end >= window.windowStart.getTime() && end < window.windowEnd.getTime()
        )
      })
    },
    async getActiveSubscriptionUserIds(userIds) {
      return new Set(userIds.filter((id) => activeUserIds.has(id)))
    },
    async claimReminder(userId) {
      if (alreadyClaimed.has(userId) || claims.get(userId)) return null
      const claimedAt = `claim-${userId}-${claims.size + 1}`
      claims.set(userId, claimedAt)
      return claimedAt
    },
    async releaseClaim(userId, claimedAt) {
      releaseCalls.push({ userId, claimedAt })
      if (claims.get(userId) === claimedAt) {
        claims.set(userId, null)
      }
    },
    async sendReminder(input) {
      if (options?.failSend) throw new Error('ResendUnavailable')
      sent.push({ email: input.email, mode: input.mode })
    },
  }
}

test('update mode window covers ≤3 days remaining and excludes expired trials', () => {
  const now = utcDate(2026, 8, 6, 15)
  const window = getTrialEndingReminderWindow(now, 'update')
  // Lower bound is `now` so already-expired times today are excluded.
  assert.equal(window.windowStart.toISOString(), '2026-08-06T15:00:00.000Z')
  assert.equal(window.windowEnd.toISOString(), '2026-08-10T00:00:00.000Z')

  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 9), now, 'update'), true) // 3 days
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 6, 16), now, 'update'), true)
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 6, 14), now, 'update'), false) // expired earlier today
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 10, 0), now, 'update'), false) // 4 days boundary
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 5), now, 'update'), false)
})

test('payment mode window is UTC day+3 inclusive to day+4 exclusive', () => {
  const now = utcDate(2026, 8, 6, 15)
  const window = getTrialEndingReminderWindow(now, 'payment')
  assert.equal(window.windowStart.toISOString(), '2026-08-09T00:00:00.000Z')
  assert.equal(window.windowEnd.toISOString(), '2026-08-10T00:00:00.000Z')

  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 9, 0), now, 'payment'), true)
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 8, 12), now, 'payment'), false)
  assert.equal(isTrialEndInReminderWindow(utcDate(2026, 8, 10, 0), now, 'payment'), false)
})

test('reminder mode follows PAYMENTS_CHECKOUT_ENABLED', () => {
  const previous = process.env.PAYMENTS_CHECKOUT_ENABLED
  try {
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'false'
    assert.equal(getTrialReminderMode(), 'update')
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'true'
    assert.equal(getTrialReminderMode(), 'payment')
  } finally {
    if (previous === undefined) delete process.env.PAYMENTS_CHECKOUT_ENABLED
    else process.env.PAYMENTS_CHECKOUT_ENABLED = previous
  }
})

test('reminders flag requires exact true', () => {
  const previous = process.env.TRIAL_ENDING_REMINDERS_ENABLED
  try {
    delete process.env.TRIAL_ENDING_REMINDERS_ENABLED
    assert.equal(isTrialEndingRemindersEnabled(), false)
    process.env.TRIAL_ENDING_REMINDERS_ENABLED = 'false'
    assert.equal(isTrialEndingRemindersEnabled(), false)
    process.env.TRIAL_ENDING_REMINDERS_ENABLED = 'TRUE'
    assert.equal(isTrialEndingRemindersEnabled(), false)
    process.env.TRIAL_ENDING_REMINDERS_ENABLED = 'true'
    assert.equal(isTrialEndingRemindersEnabled(), true)
  } finally {
    if (previous === undefined) delete process.env.TRIAL_ENDING_REMINDERS_ENABLED
    else process.env.TRIAL_ENDING_REMINDERS_ENABLED = previous
  }
})

test('disabled reminders skip DB writes and email with zero summary', async () => {
  const previous = process.env.TRIAL_ENDING_REMINDERS_ENABLED
  process.env.TRIAL_ENDING_REMINDERS_ENABLED = 'false'
  try {
    const summary = await runTrialEndingReminders()
    assert.deepEqual(summary, {
      enabled: false,
      mode: null,
      status: 'disabled',
      candidates: 0,
      claimed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    })
  } finally {
    if (previous === undefined) delete process.env.TRIAL_ENDING_REMINDERS_ENABLED
    else process.env.TRIAL_ENDING_REMINDERS_ENABLED = previous
  }
})

test('completed invocation summary reflects sends from that run only', async () => {
  const deps = createDeps({
    mode: 'update',
    candidates: [
      candidate({ id: 'user-1', email: 'a@example.com' }),
      candidate({ id: 'user-2', email: 'b@example.com' }),
    ],
  })
  const summary = await processTrialEndingReminders(deps)
  assert.equal(summary.enabled, true)
  assert.equal(summary.mode, 'update')
  assert.equal(summary.status, 'completed')
  assert.equal(summary.candidates, 2)
  assert.equal(summary.claimed, 2)
  assert.equal(summary.sent, 2)
  assert.equal(summary.failed, 0)
  assert.deepEqual(
    deps.sent.map((row) => row.email).sort(),
    ['a@example.com', 'b@example.com']
  )
})

test('user with 3 days left receives update email when checkout is closed', async () => {
  const deps = createDeps({
    mode: 'update',
    candidates: [candidate({ trial_end_date: utcDate(2026, 8, 9).toISOString() })],
  })
  const summary = await processTrialEndingReminders(deps)

  assert.equal(summary.candidates, 1)
  assert.equal(summary.claimed, 1)
  assert.equal(summary.sent, 1)
  assert.deepEqual(deps.sent, [{ email: 'owner@example.com', mode: 'update' }])
  assert.ok(deps.claims.get('user-1'))
  assert.equal(deps.listedWindows[0]?.start, '2026-08-06T08:00:00.000Z')
  assert.equal(deps.listedWindows[0]?.end, '2026-08-10T00:00:00.000Z')
})

test('user with 4+ days left does not receive update email', async () => {
  const deps = createDeps({
    mode: 'update',
    candidates: [candidate({ trial_end_date: utcDate(2026, 8, 10, 12).toISOString() })],
  })
  // Simulate DB query: only return rows that fall inside the requested window.
  deps.listCandidates = async (window) => {
    deps.listedWindows.push({
      start: window.windowStart.toISOString(),
      end: window.windowEnd.toISOString(),
    })
    const row = candidate({
      trial_end_date: utcDate(2026, 8, 10, 12).toISOString(),
    })
    const end = new Date(row.trial_end_date).getTime()
    if (end >= window.windowStart.getTime() && end < window.windowEnd.getTime()) {
      return [row]
    }
    return []
  }

  const summary = await processTrialEndingReminders(deps)
  assert.equal(summary.candidates, 0)
  assert.equal(summary.sent, 0)
  assert.equal(deps.sent.length, 0)
  assert.equal(deps.claims.size, 0)
})

test('user with active subscription is skipped', async () => {
  const deps = createDeps({
    mode: 'update',
    activeUserIds: new Set(['user-1']),
  })
  const summary = await processTrialEndingReminders(deps)

  assert.equal(summary.sent, 0)
  assert.equal(summary.skipped, 1)
  assert.equal(summary.claimed, 0)
})

test('when checkout enabled, update mode is not selected and payment window is used', async () => {
  const previous = process.env.PAYMENTS_CHECKOUT_ENABLED
  process.env.PAYMENTS_CHECKOUT_ENABLED = 'true'
  try {
    assert.equal(getTrialReminderMode(), 'payment')
    const deps = createDeps({
      mode: 'payment',
      candidates: [
        candidate({ trial_end_date: utcDate(2026, 8, 9).toISOString() }),
      ],
    })
    const summary = await processTrialEndingReminders(deps)
    assert.equal(summary.sent, 1)
    assert.deepEqual(deps.sent, [{ email: 'owner@example.com', mode: 'payment' }])
    assert.equal(deps.listedWindows[0]?.start, '2026-08-09T00:00:00.000Z')
    assert.equal(deps.listedWindows[0]?.end, '2026-08-10T00:00:00.000Z')

    // 4-day user is outside payment day+3 window
    const fourDay = createDeps({
      mode: 'payment',
      candidates: [
        candidate({ trial_end_date: utcDate(2026, 8, 10).toISOString() }),
      ],
    })
    fourDay.listCandidates = async (window) => {
      fourDay.listedWindows.push({
        start: window.windowStart.toISOString(),
        end: window.windowEnd.toISOString(),
      })
      const row = candidate({ trial_end_date: utcDate(2026, 8, 10).toISOString() })
      const end = new Date(row.trial_end_date).getTime()
      return end >= window.windowStart.getTime() && end < window.windowEnd.getTime()
        ? [row]
        : []
    }
    const skipped = await processTrialEndingReminders(fourDay)
    assert.equal(skipped.sent, 0)
    assert.equal(skipped.candidates, 0)
  } finally {
    if (previous === undefined) delete process.env.PAYMENTS_CHECKOUT_ENABLED
    else process.env.PAYMENTS_CHECKOUT_ENABLED = previous
  }
})

test('user with trial_ending_email_sent_at already claimed is skipped', async () => {
  const deps = createDeps({
    mode: 'update',
    alreadyClaimed: new Set(['user-1']),
  })
  const summary = await processTrialEndingReminders(deps)

  assert.equal(summary.sent, 0)
  assert.equal(summary.skipped, 1)
  assert.equal(deps.sent.length, 0)
})

test('two overlapping cron runs send only once', async () => {
  const sharedClaims = new Map<string, string | null>()
  const sent: Array<{ email: string; mode: TrialReminderMode }> = []

  const makeDeps = (): TrialEndingReminderDeps => ({
    mode: 'update',
    now: () => utcDate(2026, 8, 6),
    async listCandidates() {
      return [candidate()]
    },
    async getActiveSubscriptionUserIds() {
      return new Set()
    },
    async claimReminder(userId) {
      if (sharedClaims.get(userId)) return null
      const claimedAt = 'shared-claim-1'
      sharedClaims.set(userId, claimedAt)
      return claimedAt
    },
    async releaseClaim(userId, claimedAt) {
      if (sharedClaims.get(userId) === claimedAt) {
        sharedClaims.set(userId, null)
      }
    },
    async sendReminder(input) {
      sent.push({ email: input.email, mode: input.mode })
    },
  })

  const first = await processTrialEndingReminders(makeDeps())
  const second = await processTrialEndingReminders(makeDeps())

  assert.equal(first.sent, 1)
  assert.equal(second.sent, 0)
  assert.equal(second.skipped, 1)
  assert.equal(sent.length, 1)
  assert.equal(sent[0]?.mode, 'update')
})

test('Resend failure releases only matching claim timestamp', async () => {
  const deps = createDeps({ mode: 'update', failSend: true })
  const summary = await processTrialEndingReminders(deps)

  assert.equal(summary.failed, 1)
  assert.equal(summary.sent, 0)
  assert.equal(deps.claims.get('user-1'), null)
  assert.equal(deps.releaseCalls.length, 1)
  assert.equal(deps.releaseCalls[0]?.userId, 'user-1')
  assert.match(deps.releaseCalls[0]?.claimedAt ?? '', /^claim-user-1-/)
})

test('release does not clear a newer claim written by another run', async () => {
  const claims = new Map<string, string | null>()
  let sendCalls = 0

  const deps: TrialEndingReminderDeps = {
    mode: 'update',
    now: () => utcDate(2026, 8, 6),
    async listCandidates() {
      return [candidate()]
    },
    async getActiveSubscriptionUserIds() {
      return new Set()
    },
    async claimReminder(userId) {
      const claimedAt = 'claim-old'
      claims.set(userId, claimedAt)
      return claimedAt
    },
    async releaseClaim(userId, claimedAt) {
      if (claims.get(userId) === claimedAt) {
        claims.set(userId, null)
      }
    },
    async sendReminder() {
      sendCalls += 1
      claims.set('user-1', 'claim-new')
      throw new Error('ResendUnavailable')
    },
  }

  const summary = await processTrialEndingReminders(deps)
  assert.equal(summary.failed, 1)
  assert.equal(sendCalls, 1)
  assert.equal(claims.get('user-1'), 'claim-new')
})

test('cron authorize rejects missing and wrong secrets', () => {
  assert.equal(authorizeCronRequest('Bearer secret', undefined), false)
  assert.equal(authorizeCronRequest('Bearer secret', ''), false)
  assert.equal(authorizeCronRequest(null, 'secret'), false)
  assert.equal(authorizeCronRequest('Bearer wrong', 'secret'), false)
  assert.equal(authorizeCronRequest('Bearer secret', 'secret'), true)
})

test('email copy and wiring stay payment-free until checkout opens', async () => {
  const routeSource = await readFile(
    path.join(root, 'app/api/cron/trial-ending-reminders/route.ts'),
    'utf8'
  )
  const serviceSource = await readFile(
    path.join(root, 'lib/trial/trial-ending-reminders.ts'),
    'utf8'
  )
  const emailSource = await readFile(
    path.join(root, 'lib/email/resend.ts'),
    'utf8'
  )

  assert.match(routeSource, /authorizeCronRequest/)
  assert.match(routeSource, /force-dynamic/)
  assert.match(routeSource, /Cache-Control.*no-store/)
  assert.match(routeSource, /cron response/)
  assert.match(routeSource, /enabled: result\.enabled/)
  assert.match(routeSource, /mode: result\.mode/)
  assert.match(routeSource, /status: result\.status/)
  assert.doesNotMatch(routeSource, /email:|name:|trial_end_date|userId/)

  assert.match(emailSource, /sendTrialUpdateEmail/)
  assert.match(emailSource, /עדכון קטן לגבי Studio Gallery/)
  assert.match(emailSource, /אין צורך לעשות שום דבר/)
  assert.match(emailSource, /הגישה שלך לא תיחסם/)
  assert.match(emailSource, /sendTrialEndingReminderEmail/)
  assert.match(emailSource, /המשך למנוי/)

  // Update template must not include payment CTA
  const updateFnStart = emailSource.indexOf('export async function sendTrialUpdateEmail')
  const paymentFnStart = emailSource.indexOf(
    'export async function sendTrialEndingReminderEmail'
  )
  assert.ok(updateFnStart >= 0 && paymentFnStart > updateFnStart)
  const updateBody = emailSource.slice(updateFnStart, paymentFnStart)
  assert.doesNotMatch(updateBody, /המשך למנוי|\/dashboard\/subscription/)

  assert.match(serviceSource, /getTrialReminderMode/)
  assert.match(serviceSource, /sendTrialUpdateEmail/)
  assert.match(serviceSource, /sendTrialEndingReminderEmail/)
  assert.match(serviceSource, /isPaymentsCheckoutEnabled/)
  assert.match(serviceSource, /\.eq\('status', 'active'\)/)
  assert.match(
    serviceSource,
    /\.eq\('trial_ending_email_sent_at', claimedAt\)/
  )
  assert.doesNotMatch(serviceSource, /createCustomer|PayMe|createCheckout|billing_customer/)
  assert.match(serviceSource, /isTrialEndingRemindersEnabled/)
  assert.match(serviceSource, /Trial reminders disabled\./)
})

test('UI shows coming soon while checkout is disabled and keeps trial open', async () => {
  const billing = await readFile(
    path.join(root, 'components/dashboard/SubscriptionBillingPanel.tsx'),
    'utf8'
  )
  const panel = await readFile(
    path.join(root, 'components/dashboard/SubscriptionPanel.tsx'),
    'utf8'
  )
  const middleware = await readFile(path.join(root, 'middleware.ts'), 'utf8')
  const layout = await readFile(
    path.join(root, 'app/dashboard/layout.tsx'),
    'utf8'
  )

  assert.match(billing, /זמין בקרוב/)
  assert.match(billing, /תקופת הניסיון שלך ממשיכה לפעול כרגיל/)
  assert.match(panel, /הגישה שלך נשארת פתוחה עד/)
  assert.doesNotMatch(middleware, /hasActiveSubscription|ENFORCE_SUBSCRIPTION/)
  assert.doesNotMatch(layout, /hasActiveSubscription|ENFORCE_SUBSCRIPTION/)
  const previousEnforce = process.env.ENFORCE_SUBSCRIPTION_ACCESS
  try {
    delete process.env.ENFORCE_SUBSCRIPTION_ACCESS
    assert.equal(isSubscriptionEnforcementEnabled(), false)
    assert.deepEqual(evaluateStudioAccess({ trialEndDate: '2000-01-01' }), {
      allowed: true,
    })
  } finally {
    if (previousEnforce === undefined) {
      delete process.env.ENFORCE_SUBSCRIPTION_ACCESS
    } else {
      process.env.ENFORCE_SUBSCRIPTION_ACCESS = previousEnforce
    }
  }
})

test('checkout remains fail-closed and reminders never call PayMe', async () => {
  const checkout = await readFile(
    path.join(root, 'app/api/payments/checkout/route.ts'),
    'utf8'
  )
  const provider = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-provider.ts'),
    'utf8'
  )
  const service = await readFile(
    path.join(root, 'lib/trial/trial-ending-reminders.ts'),
    'utf8'
  )

  assert.match(provider, /provider_not_configured/)
  assert.match(checkout, /isPaymentsCheckoutEnabled/)
  assert.doesNotMatch(service, /createCustomer|createSubscription|createCheckout|fetch\(/)
  const previousCheckout = process.env.PAYMENTS_CHECKOUT_ENABLED
  try {
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'false'
    assert.equal(isPaymentsCheckoutEnabled(), false)
    assert.equal(getTrialReminderMode(), 'update')
  } finally {
    if (previousCheckout === undefined) {
      delete process.env.PAYMENTS_CHECKOUT_ENABLED
    } else {
      process.env.PAYMENTS_CHECKOUT_ENABLED = previousCheckout
    }
  }
})

test('migration only adds trial_ending_email_sent_at and is wrapped', async () => {
  const sql = await readFile(
    path.join(
      root,
      'supabase/migrations/20260806000000_add_trial_ending_email_sent_at.sql'
    ),
    'utf8'
  )
  assert.match(sql, /^begin;/m)
  assert.match(sql, /^commit;/m)
  assert.match(
    sql,
    /add column if not exists trial_ending_email_sent_at timestamptz/
  )
  assert.doesNotMatch(sql, /drop |delete |trial_end_date/)
})

test('vercel.json keeps existing cron and adds trial reminders once', async () => {
  const vercel = JSON.parse(
    await readFile(path.join(root, 'vercel.json'), 'utf8')
  ) as {
    crons: Array<{ path: string; schedule: string }>
  }

  assert.deepEqual(vercel.crons, [
    {
      path: '/api/cron/cleanup-orphaned-photos',
      schedule: '0 0 * * *',
    },
    {
      path: '/api/cron/trial-ending-reminders',
      schedule: '0 0 * * *',
    },
  ])
})
