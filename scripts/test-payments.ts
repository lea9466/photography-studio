import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  evaluateStudioAccess,
  isSubscriptionEnforcementEnabled,
} from '../lib/payments/access'
import { PaymentError } from '../lib/payments/errors'
import { isPaymentsCheckoutEnabled } from '../lib/payments/flags'
import { PaymentService } from '../lib/payments/payment-service'
import { createPaymentProvider } from '../lib/payments/provider-factory'
import { mapPayMeCheckout } from '../lib/payments/providers/payme/payme-mapper'
import type { BillingRepository } from '../lib/payments/repository'
import type {
  CheckoutSession,
  PaymentProviderName,
  WebhookEvent,
} from '../lib/payments/types'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const plan = {
  id: 'plan-1',
  code: 'studio_monthly',
  name: 'מנוי חודשי',
  description: null,
  amount_agorot: 4000,
  currency: 'ILS',
  billing_interval: 'month' as const,
  is_active: true,
  provider: null,
  provider_plan_id: null,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'subscription-1',
    user_id: 'user-1',
    billing_customer_id: 'customer-row-1',
    plan_id: plan.id,
    provider: 'payme',
    provider_subscription_id: 'provider-sub-1',
    status: 'pending' as const,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    cancelled_at: null,
    last_payment_at: null,
    next_payment_at: null,
    provider_metadata: {},
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

class MemoryRepository implements BillingRepository {
  subscriptions = [subscription()]
  transactions: Array<Record<string, unknown>> = []
  claims = new Map<string, { id: string; status: string }>()
  checkoutPlanAmount: number | null = null

  async getUserEmail() {
    return 'owner@example.com'
  }
  async getActivePlanByCode(code: string) {
    return code === plan.code ? plan : null
  }
  async getPlanById(id: string) {
    return id === plan.id ? plan : null
  }
  async getBillingCustomer(userId: string, provider: PaymentProviderName) {
    if (userId !== 'user-1') return null
    return {
      id: 'customer-row-1',
      user_id: userId,
      provider,
      provider_customer_id: 'provider-customer-1',
      email: 'owner@example.com',
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }
  }
  async getBillingCustomerByExternalId(
    provider: PaymentProviderName,
    externalCustomerId: string
  ) {
    return this.getBillingCustomer(
      externalCustomerId === 'provider-customer-1' ? 'user-1' : 'missing',
      provider
    )
  }
  async saveBillingCustomer(input: {
    userId: string
    provider: PaymentProviderName
    externalCustomerId: string
    email: string
  }) {
    return {
      id: 'customer-row-1',
      user_id: input.userId,
      provider: input.provider,
      provider_customer_id: input.externalCustomerId,
      email: input.email,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }
  }
  async getCurrentSubscription(userId: string) {
    return this.subscriptions.find((row) => row.user_id === userId) ?? null
  }
  async getSubscriptionByExternalId(
    provider: PaymentProviderName,
    externalSubscriptionId: string
  ) {
    return (
      this.subscriptions.find(
        (row) =>
          row.provider === provider &&
          row.provider_subscription_id === externalSubscriptionId
      ) ?? null
    )
  }
  async upsertSubscription(input: {
    userId: string
    planId: string
    billingCustomerId: string | null
    provider: PaymentProviderName
    externalSubscriptionId: string
    status: typeof this.subscriptions[number]['status']
  }) {
    const row = subscription({
      user_id: input.userId,
      plan_id: input.planId,
      billing_customer_id: input.billingCustomerId,
      provider: input.provider,
      provider_subscription_id: input.externalSubscriptionId,
      status: input.status,
    })
    this.subscriptions = [row]
    return row
  }
  async updateSubscription(
    id: string,
    input: {
      status?: typeof this.subscriptions[number]['status']
      periodStart?: string | null
      periodEnd?: string | null
      nextPaymentAt?: string | null
      lastPaymentAt?: string | null
      cancelAtPeriodEnd?: boolean
      cancelledAt?: string | null
    }
  ) {
    const index = this.subscriptions.findIndex((row) => row.id === id)
    assert.notEqual(index, -1)
    const current = this.subscriptions[index]
    const updated = subscription({
      ...current,
      status: input.status ?? current.status,
      current_period_start: input.periodStart ?? current.current_period_start,
      current_period_end: input.periodEnd ?? current.current_period_end,
      next_payment_at: input.nextPaymentAt ?? current.next_payment_at,
      last_payment_at: input.lastPaymentAt ?? current.last_payment_at,
      cancel_at_period_end:
        input.cancelAtPeriodEnd ?? current.cancel_at_period_end,
      cancelled_at: input.cancelledAt ?? current.cancelled_at,
      updated_at: '2026-08-05T00:00:00.000Z',
    })
    this.subscriptions[index] = updated
    return updated
  }
  async upsertTransaction(input: Record<string, unknown>) {
    this.transactions = [
      ...this.transactions.filter(
        (row) => row.externalTransactionId !== input.externalTransactionId
      ),
      input,
    ]
    return {
      id: 'transaction-1',
      user_id: input.userId as string,
      subscription_id: input.subscriptionId as string | null,
      provider: input.provider as string,
      provider_transaction_id: input.externalTransactionId as string,
      status: input.status as 'succeeded',
      amount_agorot: input.amountAgorot as number,
      currency: input.currency as string,
      failure_code: null,
      failure_message: null,
      paid_at: null,
      raw_metadata: {},
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }
  }
  async claimWebhook(event: WebhookEvent) {
    const key = `${event.provider}:${event.id}`
    const existing = this.claims.get(key)
    if (existing && existing.status !== 'failed') {
      return { eventId: existing.id, claimed: false, status: existing.status }
    }
    const claimed = { id: existing?.id ?? `event-${this.claims.size + 1}`, status: 'processing' }
    this.claims.set(key, claimed)
    return { eventId: claimed.id, claimed: true, status: claimed.status }
  }
  async finishWebhook(
    eventId: string,
    status: 'processed' | 'ignored' | 'failed'
  ) {
    for (const [key, value] of this.claims) {
      if (value.id === eventId) this.claims.set(key, { ...value, status })
    }
  }
}

class FakeProvider {
  readonly name = 'payme' as const
  checkoutPlanAmount: number | null = null

  async createCustomer() {
    return { id: 'provider-customer-1', provider: this.name, email: 'owner@example.com' }
  }
  async createCheckoutSession(input: { plan: { amountAgorot: number } }): Promise<CheckoutSession> {
    this.checkoutPlanAmount = input.plan.amountAgorot
    return {
      id: 'checkout-1',
      provider: this.name,
      url: 'https://sandbox.example/checkout',
      token: null,
      expiresAt: null,
    }
  }
  async createSubscription() {
    throw new Error('not used')
  }
  async getSubscription() {
    throw new Error('not used')
  }
  async cancelSubscription() {
    return {
      id: 'provider-sub-1',
      provider: this.name,
      customerId: 'provider-customer-1',
      planId: plan.id,
      status: 'active' as const,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: true,
      cancelledAt: null,
      nextPaymentAt: null,
      metadata: {},
    }
  }
  async updatePaymentMethod() {
    throw new Error('not used')
  }
  async parseWebhook() {
    throw new Error('not used')
  }
}

function event(
  type: WebhookEvent['type'],
  overrides: Partial<WebhookEvent> = {}
): WebhookEvent {
  return {
    id: `evt-${type}`,
    provider: 'payme',
    type,
    occurredAt: '2026-08-05T12:00:00.000Z',
    externalCustomerId: 'provider-customer-1',
    externalSubscriptionId: 'provider-sub-1',
    externalTransactionId: 'provider-tx-1',
    rawPayload: { verifiedFixture: true },
    data: {
      planCode: 'studio_monthly',
      amountAgorot: 4000,
      currency: 'ILS',
      periodEnd: '2026-09-05T12:00:00.000Z',
    },
    ...overrides,
  }
}

test('provider factory returns PayMe for PAYMENT_PROVIDER=payme', () => {
  process.env.PAYMENT_PROVIDER = 'payme'
  assert.equal(createPaymentProvider().name, 'payme')
})

test('PayMe mapper fails closed until official fields are verified', () => {
  assert.throws(
    () => mapPayMeCheckout({ anything: 'unverified' }),
    (error) =>
      error instanceof PaymentError && error.code === 'provider_not_configured'
  )
})

test('PayMe operations fail closed without returning fabricated results', async () => {
  process.env.PAYMENT_PROVIDER = 'payme'
  delete process.env.PAYME_API_BASE_URL
  delete process.env.PAYME_API_KEY
  delete process.env.PAYME_SELLER_ID
  delete process.env.PAYME_WEBHOOK_SECRET
  const provider = createPaymentProvider()
  const rejectedSafely = (promise: Promise<unknown>) =>
    assert.rejects(
      promise,
      (error) =>
        error instanceof PaymentError &&
        error.code === 'provider_not_configured' &&
        !error.message.includes('PAYME_')
    )

  await rejectedSafely(
    provider.createCustomer({ userId: 'user-1', email: 'owner@example.com' })
  )
  await rejectedSafely(
    provider.createCheckoutSession({
      userId: 'user-1',
      customer: null,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: null,
        amountAgorot: 4000,
        currency: 'ILS',
        billingInterval: 'month',
        providerPlanId: null,
      },
      successUrl: 'https://app.example/success',
      cancelUrl: 'https://app.example/cancel',
    })
  )
  await rejectedSafely(
    provider.createSubscription({
      customerId: 'customer',
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: null,
        amountAgorot: 4000,
        currency: 'ILS',
        billingInterval: 'month',
        providerPlanId: null,
      },
    })
  )
  await rejectedSafely(
    provider.updatePaymentMethod({
      externalCustomerId: 'customer',
      externalSubscriptionId: 'subscription',
      returnUrl: 'https://app.example/return',
    })
  )
  await rejectedSafely(
    provider.parseWebhook({
      rawBody: new TextEncoder().encode('{"forged":true}'),
      headers: new Headers(),
    })
  )
})

test('checkout price comes from the repository plan', async () => {
  const repository = new MemoryRepository()
  const provider = new FakeProvider()
  const service = new PaymentService(repository, () => provider)

  await service.createCheckout({
    userId: 'user-1',
    planCode: 'studio_monthly',
    successUrl: 'https://app.example/success',
    cancelUrl: 'https://app.example/cancel',
  })

  assert.equal(provider.checkoutPlanAmount, 4000)
})

test('successful webhook activates subscription and stores transaction', async () => {
  const repository = new MemoryRepository()
  const service = new PaymentService(repository, () => new FakeProvider())
  await service.processNormalizedWebhook(event('payment.succeeded'))

  assert.equal(repository.subscriptions[0].status, 'active')
  assert.equal(repository.transactions.length, 1)
  assert.equal(repository.transactions[0].status, 'succeeded')
})

test('failed payment never activates subscription', async () => {
  const repository = new MemoryRepository()
  const service = new PaymentService(repository, () => new FakeProvider())
  await service.processNormalizedWebhook(event('payment.failed'))

  assert.equal(repository.subscriptions[0].status, 'payment_failed')
  assert.notEqual(repository.subscriptions[0].status, 'active')
})

test('duplicate webhook is not processed twice', async () => {
  const repository = new MemoryRepository()
  const service = new PaymentService(repository, () => new FakeProvider())
  const webhook = event('payment.succeeded')

  const first = await service.processNormalizedWebhook(webhook)
  const second = await service.processNormalizedWebhook(webhook)

  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
  assert.equal(repository.transactions.length, 1)
})

test('unknown verified webhook is saved and ignored without throwing', async () => {
  const repository = new MemoryRepository()
  const service = new PaymentService(repository, () => new FakeProvider())
  const result = await service.processNormalizedWebhook(event('unknown'))

  assert.equal(result.status, 'ignored')
  assert.equal(repository.claims.size, 1)
})

test('service refuses to cancel a subscription owned by another user', async () => {
  const repository = new MemoryRepository()
  repository.getCurrentSubscription = async () =>
    subscription({ user_id: 'other-user' })
  const service = new PaymentService(repository, () => new FakeProvider())

  await assert.rejects(
    service.cancelSubscription('user-1'),
    (error) =>
      error instanceof PaymentError && error.code === 'subscription_not_found'
  )
})

test('migration denies cross-user writes and hides raw billing data', async () => {
  const sql = await readFile(
    path.join(
      root,
      'supabase/migrations/20260802000000_add_payment_infrastructure.sql'
    ),
    'utf8'
  )
  assert.match(sql, /using \(user_id = auth\.uid\(\)\)/)
  assert.match(sql, /create policy "billing_customers_select_own"/)
  assert.match(sql, /\) on public\.billing_customers to authenticated/)
  assert.doesNotMatch(
    sql.match(/grant select \([\s\S]*?\) on public\.billing_customers/)?.[0] ?? '',
    /provider_customer_id/
  )
  assert.match(sql, /revoke all on table public\.subscriptions from anon, authenticated/)
  assert.match(sql, /revoke all on table public\.payment_webhook_events from anon, authenticated/)
  assert.doesNotMatch(
    sql.match(/grant select \([\s\S]*?\) on public\.subscriptions/)?.[0] ?? '',
    /provider_metadata/
  )
  assert.doesNotMatch(
    sql.match(/grant select \([\s\S]*?\) on public\.payment_transactions/)?.[0] ?? '',
    /raw_metadata/
  )
})

test('checkout endpoint accepts plan code but never client price', async () => {
  const source = await readFile(
    path.join(root, 'app/api/payments/checkout/route.ts'),
    'utf8'
  )
  assert.match(source, /body\.planCode/)
  assert.doesNotMatch(source, /body\.(amount|price|amountAgorot)/)
  assert.doesNotMatch(source, /body\.userId/)
})

test('checkout flag defaults off and gates before provider work', async () => {
  const previous = process.env.PAYMENTS_CHECKOUT_ENABLED
  const source = await readFile(
    path.join(root, 'app/api/payments/checkout/route.ts'),
    'utf8'
  )
  try {
    delete process.env.PAYMENTS_CHECKOUT_ENABLED
    assert.equal(isPaymentsCheckoutEnabled(), false)
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'false'
    assert.equal(isPaymentsCheckoutEnabled(), false)
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'true'
    assert.equal(isPaymentsCheckoutEnabled(), true)
  } finally {
    if (previous === undefined) delete process.env.PAYMENTS_CHECKOUT_ENABLED
    else process.env.PAYMENTS_CHECKOUT_ENABLED = previous
  }

  // Flag check must appear before createPaymentService / createCheckout.
  const flagIndex = source.indexOf('isPaymentsCheckoutEnabled')
  const serviceIndex = source.indexOf('createPaymentService')
  assert.ok(flagIndex >= 0)
  assert.ok(serviceIndex > flagIndex)
  assert.match(source, /billing_not_initialized/)
})

test('subscription view exposes checkoutEnabled and enforcement stays off', async () => {
  const previousCheckout = process.env.PAYMENTS_CHECKOUT_ENABLED
  const previousEnforce = process.env.ENFORCE_SUBSCRIPTION_ACCESS
  try {
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'false'
    delete process.env.ENFORCE_SUBSCRIPTION_ACCESS
    const repository = new MemoryRepository()
    const service = new PaymentService(repository, () => new FakeProvider())
    const view = await service.getCurrentSubscription('user-1')
    assert.equal(view.configured, true)
    assert.equal(view.checkoutEnabled, false)
    assert.equal(view.availablePlan?.amountAgorot, 4000)
    assert.equal(isSubscriptionEnforcementEnabled(), false)
    assert.deepEqual(
      evaluateStudioAccess({
        trialEndDate: '2000-01-01T00:00:00.000Z',
        hasActivePaidSubscription: false,
      }),
      { allowed: true }
    )
  } finally {
    if (previousCheckout === undefined) {
      delete process.env.PAYMENTS_CHECKOUT_ENABLED
    } else {
      process.env.PAYMENTS_CHECKOUT_ENABLED = previousCheckout
    }
    if (previousEnforce === undefined) {
      delete process.env.ENFORCE_SUBSCRIPTION_ACCESS
    } else {
      process.env.ENFORCE_SUBSCRIPTION_ACCESS = previousEnforce
    }
  }
})

test('PayMe provider source never issues HTTP while fail-closed', async () => {
  const provider = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-provider.ts'),
    'utf8'
  )
  const client = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-client.ts'),
    'utf8'
  )
  assert.match(provider, /provider_not_configured/)
  assert.doesNotMatch(provider, /generate-subscription|fetch\(|axios/)
  assert.match(client, /provider_not_configured/)
})

test('env example documents pause flags', async () => {
  const envExample = await readFile(path.join(root, '.env.example'), 'utf8')
  assert.match(envExample, /TRIAL_ENDING_REMINDERS_ENABLED=false/)
  assert.match(envExample, /PAYMENTS_CHECKOUT_ENABLED=false/)
  assert.match(envExample, /ENFORCE_SUBSCRIPTION_ACCESS=false/)
})
