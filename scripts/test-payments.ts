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
import {
  isPaymentsCheckoutEnabled,
  isPaymentsCheckoutAllowed,
  isPaymentsSmokeTestUser,
} from '../lib/payments/flags'
import { PaymentService } from '../lib/payments/payment-service'
import { createPaymentProvider } from '../lib/payments/provider-factory'
import { payMeIterationTypeForPlan } from '../lib/payments/providers/payme/payme-iteration'
import {
  buildGenerateSubscriptionRequest,
  PAYME_CORRELATION_FIELD_UNKNOWN,
  withGenerateSubscriptionCorrelation,
} from '../lib/payments/providers/payme/payme-generate'
import { mapPayMeCheckout } from '../lib/payments/providers/payme/payme-mapper'
import { parsePayMeWebhook } from '../lib/payments/providers/payme/payme-webhook'
import { PAYME_CALLBACK_CONTENT_TYPE } from '../lib/payments/providers/payme/payme-callback-config'
import { handleVerifiedFirstPayment } from '../lib/payments/providers/payme/payme-handlers'
import {
  mapPaymeSubscriptionStatus,
  isPayMeSubscriptionStatusMappingConfigured,
  PAYME_SUB_STATUS,
} from '../lib/payments/providers/payme/payme-subscription-statuses'
import {
  mapPaymeTransactionStatus,
  PAYME_TRANSACTION_STATUS,
} from '../lib/payments/providers/payme/payme-transaction-statuses'
import {
  mapPayMeSubStatusToLocal,
  verifyActiveSubscriptionS2S,
  verifySubscriptionAgainstPlan,
  verifySuccessfulTransaction,
} from '../lib/payments/providers/payme/payme-verify'
import type { BillingRepository } from '../lib/payments/repository'
import type {
  CheckoutSession,
  PaymentPlan,
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

const yearlyPlan = {
  id: 'plan-2',
  code: 'studio_yearly',
  name: 'מנוי שנתי',
  description: null,
  amount_agorot: 40000,
  currency: 'ILS',
  billing_interval: 'year' as const,
  is_active: true,
  provider: null,
  provider_plan_id: null,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
}

const inactivePlan = {
  ...yearlyPlan,
  id: 'plan-inactive',
  code: 'studio_inactive',
  is_active: false,
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
  plans = [plan, yearlyPlan, inactivePlan]

  async getActivePlanByCode(code: string) {
    return this.plans.find((row) => row.code === code && row.is_active) ?? null
  }
  async listActivePlans() {
    return this.plans.filter((row) => row.is_active)
  }
  async getPlanById(id: string) {
    return this.plans.find((row) => row.id === id) ?? null
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
      providerSubscriptionId?: string | null
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
      provider_subscription_id:
        input.providerSubscriptionId ?? current.provider_subscription_id,
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
  async getTransactionByExternalId(
    provider: PaymentProviderName,
    externalTransactionId: string
  ) {
    const row = this.transactions.find(
      (item) =>
        item.provider === provider &&
        item.externalTransactionId === externalTransactionId
    )
    if (!row) return null
    return {
      id: 'transaction-1',
      user_id: row.userId as string,
      subscription_id: row.subscriptionId as string | null,
      provider,
      provider_transaction_id: externalTransactionId,
      status: row.status as 'succeeded',
      amount_agorot: row.amountAgorot as number,
      currency: row.currency as string,
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
  async createOneTimeCheckoutSession(): Promise<CheckoutSession> {
    throw new Error('not used')
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
  async verifySubscriptionByCorrelation() {
    return null
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

test('provider factory rejects missing PAYMENT_PROVIDER', () => {
  const previous = process.env.PAYMENT_PROVIDER
  try {
    delete process.env.PAYMENT_PROVIDER
    assert.throws(
      () => createPaymentProvider(),
      (error) => error instanceof PaymentError && error.code === 'provider_not_configured'
    )
  } finally {
    if (previous === undefined) delete process.env.PAYMENT_PROVIDER
    else process.env.PAYMENT_PROVIDER = previous
  }
})

test('PayMe provider can initialize without PAYME_WEBHOOK_SECRET', async () => {
  const previous = {
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    PAYME_ENV: process.env.PAYME_ENV,
    PAYME_API_BASE_URL: process.env.PAYME_API_BASE_URL,
    PAYME_CLIENT_KEY: process.env.PAYME_CLIENT_KEY,
    PAYME_SELLER_ID: process.env.PAYME_SELLER_ID,
    PAYME_WEBHOOK_SECRET: process.env.PAYME_WEBHOOK_SECRET,
  }

  try {
    process.env.PAYMENT_PROVIDER = 'payme'
    process.env.PAYME_ENV = 'sandbox'
    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'
    process.env.PAYME_CLIENT_KEY = 'test-key'
    process.env.PAYME_SELLER_ID = 'MPL-TEST'
    delete process.env.PAYME_WEBHOOK_SECRET

    const { readPayMeEnvironment } = await import(
      '../lib/payments/providers/payme/payme-client'
    )
    const env = readPayMeEnvironment()
    assert.equal(env.sellerId, 'MPL-TEST')
    assert.equal(env.clientKey, 'test-key')
    assert.equal(env.webhookSecret, null)
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('PayMe mapper fails closed until official fields are verified', () => {
  assert.throws(
    () => mapPayMeCheckout({ anything: 'unverified' }),
    (error) =>
      error instanceof PaymentError && error.code === 'provider_not_configured'
  )
})

test('generate-subscription uses the official subscription_id correlation in sandbox mode', async () => {
  process.env.PAYMENT_PROVIDER = 'payme'
  process.env.PAYME_ENV = 'sandbox'
  process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'
  process.env.PAYME_CLIENT_KEY = 'test-key'
  process.env.PAYME_SELLER_ID = 'MPL-TEST'
  process.env.PAYME_WEBHOOK_SECRET = 'whsec'
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

  const provider = createPaymentProvider()
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }

  const customer = await provider.createCustomer({
    userId: 'user-1',
    email: 'owner@example.com',
  })
  assert.equal(customer.provider, 'payme')

  await assert.rejects(
    provider.createCheckoutSession({
      userId: 'user-1',
      customer,
      plan: monthly,
      successUrl: 'https://app.example/success',
      cancelUrl: 'https://app.example/cancel',
      localSubscriptionId: 'sub_local_1',
    }),
    (error) => error instanceof PaymentError && error.code === 'provider_unavailable'
  )

  await assert.rejects(
    provider.createSubscription({ customerId: customer.id, plan: monthly }),
    (error) => error instanceof PaymentError && error.code === 'provider_not_configured'
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

test('smoke-test allowlist enables checkout only for monthly plan', async () => {
  const previousEnv = {
    PAYMENTS_CHECKOUT_ENABLED: process.env.PAYMENTS_CHECKOUT_ENABLED,
    PAYMENTS_SMOKE_TEST_USER_ID: process.env.PAYMENTS_SMOKE_TEST_USER_ID,
  }

  try {
    process.env.PAYMENTS_CHECKOUT_ENABLED = 'false'
    process.env.PAYMENTS_SMOKE_TEST_USER_ID = 'test-user-123'

    assert.equal(isPaymentsCheckoutAllowed('test-user-123'), true)
    assert.equal(isPaymentsCheckoutAllowed('other-user'), false)

    const source = await readFile(
      path.join(root, 'app/api/payments/checkout/route.ts'),
      'utf8'
    )
    assert.match(source, /isPaymentsCheckoutAllowed\(context.userId\)/)
    assert.match(source, /planCode !== 'studio_monthly'/)
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('smoke-test override payload uses 500 agorot and 1 iteration', () => {
  const body = buildGenerateSubscriptionRequest({
    paymeClientKey: 'test-key',
    sellerPaymeId: 'MPL-TEST',
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
    callbackUrl: 'https://app.example/api/payments/webhooks/payme',
    returnUrl: 'https://app.example/dashboard/subscription',
    localSubscriptionId: 'sub_smoke_test',
    subPrice: 500,
    subIterations: 1,
    test: false,
  })

  assert.equal(body.sub_price, 500)
  assert.equal(body.sub_iterations, 1)
  assert.equal(body.sub_iteration_type, 3)
  assert.equal(body.subscription_id, 'sub_smoke_test')
})

test('subscription view exposes both plans and enforcement stays off', async () => {
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
    assert.equal(view.availablePlans.length, 2)
    assert.equal(
      view.availablePlans.find((item) => item.code === 'studio_monthly')
        ?.amountAgorot,
      4000
    )
    assert.equal(
      view.availablePlans.find((item) => item.code === 'studio_yearly')
        ?.amountAgorot,
      40000
    )
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

test('seller-only sandbox config can build generate-subscription without client key', async () => {
  const previous = {
    PAYME_ENV: process.env.PAYME_ENV,
    PAYME_API_BASE_URL: process.env.PAYME_API_BASE_URL,
    PAYME_CLIENT_KEY: process.env.PAYME_CLIENT_KEY,
    PAYME_API_KEY: process.env.PAYME_API_KEY,
    PAYME_SELLER_ID: process.env.PAYME_SELLER_ID,
    PAYME_WEBHOOK_SECRET: process.env.PAYME_WEBHOOK_SECRET,
  }
  try {
    delete process.env.PAYME_CLIENT_KEY
    delete process.env.PAYME_API_KEY
    process.env.PAYME_SELLER_ID = 'sandbox-seller'
    process.env.PAYME_WEBHOOK_SECRET = 'secret'
    process.env.PAYME_ENV = 'sandbox'
    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'

    const { readPayMeEnvironment } = await import(
      '../lib/payments/providers/payme/payme-client'
    )
    const env = readPayMeEnvironment()
    assert.equal(env.sellerId, 'sandbox-seller')
    assert.equal(env.clientKey, null)

    const body = buildGenerateSubscriptionRequest({
      paymeClientKey: env.clientKey ?? undefined,
      sellerPaymeId: env.sellerId,
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
      callbackUrl: 'https://app.example/api/payments/webhooks/payme',
      returnUrl: 'https://app.example/dashboard/subscription',
      localSubscriptionId: 'sub_seller_only',
    })

    assert.equal(body.seller_payme_id, 'sandbox-seller')
    assert.equal(body.payme_client_key, undefined)
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('missing seller id fails closed', async () => {
  const previous = {
    PAYME_ENV: process.env.PAYME_ENV,
    PAYME_API_BASE_URL: process.env.PAYME_API_BASE_URL,
    PAYME_CLIENT_KEY: process.env.PAYME_CLIENT_KEY,
    PAYME_API_KEY: process.env.PAYME_API_KEY,
    PAYME_SELLER_ID: process.env.PAYME_SELLER_ID,
    PAYME_WEBHOOK_SECRET: process.env.PAYME_WEBHOOK_SECRET,
  }
  try {
    delete process.env.PAYME_SELLER_ID
    delete process.env.PAYME_CLIENT_KEY
    delete process.env.PAYME_API_KEY
    process.env.PAYME_WEBHOOK_SECRET = 'secret'
    process.env.PAYME_ENV = 'sandbox'
    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'

    const { readPayMeEnvironment } = await import(
      '../lib/payments/providers/payme/payme-client'
    )
    assert.throws(
      () => readPayMeEnvironment(),
      (error) =>
        error instanceof PaymentError && error.code === 'provider_not_configured'
    )
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('client key is optional and only sent when configured', () => {
  const bodyWithKey = buildGenerateSubscriptionRequest({
    paymeClientKey: 'partner-key',
    sellerPaymeId: 'seller-123',
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
    callbackUrl: 'https://app.example/api/payments/webhooks/payme',
    returnUrl: 'https://app.example/dashboard/subscription',
    localSubscriptionId: 'sub_with_key',
  })
  assert.equal(bodyWithKey.payme_client_key, 'partner-key')

  const bodyWithoutKey = buildGenerateSubscriptionRequest({
    paymeClientKey: undefined,
    sellerPaymeId: 'seller-123',
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
    callbackUrl: 'https://app.example/api/payments/webhooks/payme',
    returnUrl: 'https://app.example/dashboard/subscription',
    localSubscriptionId: 'sub_without_key',
  })
  assert.equal(bodyWithoutKey.payme_client_key, undefined)
})

test('sandbox client rejects live endpoint and non-sandbox PAYME_ENV', async () => {
  const previous = {
    PAYME_ENV: process.env.PAYME_ENV,
    PAYME_API_BASE_URL: process.env.PAYME_API_BASE_URL,
    PAYME_CLIENT_KEY: process.env.PAYME_CLIENT_KEY,
    PAYME_API_KEY: process.env.PAYME_API_KEY,
    PAYME_SELLER_ID: process.env.PAYME_SELLER_ID,
    PAYME_WEBHOOK_SECRET: process.env.PAYME_WEBHOOK_SECRET,
  }
  try {
    process.env.PAYME_CLIENT_KEY = 'key'
    process.env.PAYME_SELLER_ID = 'sandbox-seller'
    process.env.PAYME_WEBHOOK_SECRET = 'secret'
    process.env.PAYME_ENV = 'sandbox'
    process.env.PAYME_API_BASE_URL = 'https://live.payme.io/api'
    const { readPayMeEnvironment } = await import(
      '../lib/payments/providers/payme/payme-client'
    )
    assert.throws(
      () => readPayMeEnvironment(),
      (error) =>
        error instanceof PaymentError && error.code === 'provider_not_configured'
    )

    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'
    process.env.PAYME_ENV = 'production'
    assert.throws(
      () => readPayMeEnvironment(),
      (error) =>
        error instanceof PaymentError && error.code === 'provider_not_configured'
    )

    process.env.PAYME_ENV = 'sandbox'
    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'
    const env = readPayMeEnvironment()
    assert.equal(env.sellerId, 'sandbox-seller')
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('production PayMe environment is accepted only with live base url', async () => {
  const previous = {
    PAYME_ENV: process.env.PAYME_ENV,
    PAYME_API_BASE_URL: process.env.PAYME_API_BASE_URL,
    PAYME_CLIENT_KEY: process.env.PAYME_CLIENT_KEY,
    PAYME_API_KEY: process.env.PAYME_API_KEY,
    PAYME_SELLER_ID: process.env.PAYME_SELLER_ID,
    PAYME_WEBHOOK_SECRET: process.env.PAYME_WEBHOOK_SECRET,
  }
  try {
    process.env.PAYME_CLIENT_KEY = 'key'
    process.env.PAYME_SELLER_ID = 'live-seller'
    process.env.PAYME_WEBHOOK_SECRET = 'secret'
    process.env.PAYME_ENV = 'production'
    process.env.PAYME_API_BASE_URL = 'https://live.payme.io/api'
    const { readPayMeEnvironment } = await import(
      '../lib/payments/providers/payme/payme-client'
    )
    const env = readPayMeEnvironment()
    assert.equal(env.env, 'production')
    assert.equal(env.apiBaseUrl, 'https://live.payme.io/api')
    assert.equal(env.sellerId, 'live-seller')

    process.env.PAYME_API_BASE_URL = 'https://sandbox.payme.io/api'
    assert.throws(
      () => readPayMeEnvironment(),
      (error) =>
        error instanceof PaymentError && error.code === 'provider_not_configured'
    )
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('env example documents pause flags and sandbox defaults', async () => {
  const envExample = await readFile(path.join(root, '.env.example'), 'utf8')
  assert.match(envExample, /TRIAL_ENDING_REMINDERS_ENABLED=false/)
  assert.match(envExample, /PAYMENTS_CHECKOUT_ENABLED=false/)
  assert.match(envExample, /ENFORCE_SUBSCRIPTION_ACCESS=false/)
  assert.match(envExample, /PAYME_ENV=sandbox/)
  assert.match(envExample, /sandbox\.payme\.io/)
})

test('iteration types and generate payload are plan-driven', () => {
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }
  const yearly: PaymentPlan = {
    id: yearlyPlan.id,
    code: yearlyPlan.code,
    name: yearlyPlan.name,
    description: null,
    amountAgorot: 40000,
    currency: 'ILS',
    billingInterval: 'year',
    providerPlanId: null,
  }

  assert.equal(payMeIterationTypeForPlan(monthly), 3)
  assert.equal(payMeIterationTypeForPlan(yearly), 4)

  const monthlyBody = buildGenerateSubscriptionRequest({
    paymeClientKey: 'test-key',
    sellerPaymeId: 'MPL-TEST',
    plan: monthly,
    callbackUrl: 'https://app.example/api/payments/webhooks/payme',
    returnUrl: 'https://app.example/dashboard/subscription',
    localSubscriptionId: 'sub_monthly',
  })
  assert.equal(monthlyBody.sub_price, 4000)
  assert.equal(monthlyBody.sub_iteration_type, 3)

  const body = buildGenerateSubscriptionRequest({
    paymeClientKey: 'test-key',
    sellerPaymeId: 'MPL-TEST',
    plan: yearly,
    callbackUrl: 'https://app.example/api/payments/webhooks/payme',
    returnUrl: 'https://app.example/dashboard/subscription',
    localSubscriptionId: 'sub_abc',
  })
  assert.equal(body.sub_price, 40000)
  assert.equal(body.sub_iteration_type, 4)
  assert.equal(body.sub_currency, 'ILS')
  assert.equal(body.test, undefined)
  assert.equal(PAYME_CORRELATION_FIELD_UNKNOWN, false)
  assert.equal(monthlyBody.payme_client_key, 'test-key')
  assert.equal(monthlyBody.subscription_id, 'sub_monthly')
  assert.equal(body.payme_client_key, 'test-key')
  assert.equal(body.subscription_id, 'sub_abc')
  assert.deepEqual(withGenerateSubscriptionCorrelation(body, 'sub_abc'), {
    ...body,
    subscription_id: 'sub_abc',
  })
})

test('S2S subscription verification is plan-driven', () => {
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }
  const yearly: PaymentPlan = {
    id: yearlyPlan.id,
    code: yearlyPlan.code,
    name: yearlyPlan.name,
    description: null,
    amountAgorot: 40000,
    currency: 'ILS',
    billingInterval: 'year',
    providerPlanId: null,
  }

  verifySubscriptionAgainstPlan(
    {
      seller_payme_id: 'MPL-TEST',
      subscription_id: 'sub_1',
      sub_payme_id: 'SUB-1',
      sub_price: 4000,
      sub_currency: 'ILS',
      sub_iteration_type: 3,
      sub_paid: true,
    },
    {
      plan: monthly,
      sellerPaymeId: 'MPL-TEST',
      expectedSubscriptionId: 'sub_1',
      expectedSubPaymeId: 'SUB-1',
    }
  )

  verifySubscriptionAgainstPlan(
    {
      seller_payme_id: 'MPL-TEST',
      subscription_id: 'sub_y',
      sub_payme_id: 'SUB-Y',
      sub_price: 40000,
      sub_currency: 'ILS',
      sub_iteration_type: 4,
      sub_paid: true,
    },
    {
      plan: yearly,
      sellerPaymeId: 'MPL-TEST',
      expectedSubscriptionId: 'sub_y',
      expectedSubPaymeId: 'SUB-Y',
    }
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        {
          seller_payme_id: 'MPL-TEST',
          subscription_id: 'sub_1',
          sub_payme_id: 'SUB-1',
          sub_price: 3999,
          sub_currency: 'ILS',
          sub_iteration_type: 3,
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubscriptionId: 'sub_1' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        {
          seller_payme_id: 'MPL-TEST',
          subscription_id: 'sub_1',
          sub_payme_id: 'SUB-1',
          sub_price: 4000,
          sub_currency: 'USD',
          sub_iteration_type: 3,
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubscriptionId: 'sub_1' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        {
          seller_payme_id: 'WRONG',
          subscription_id: 'sub_1',
          sub_payme_id: 'SUB-1',
          sub_price: 4000,
          sub_currency: 'ILS',
          sub_iteration_type: 3,
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubscriptionId: 'sub_1' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        {
          seller_payme_id: 'MPL-TEST',
          subscription_id: 'other',
          sub_payme_id: 'SUB-1',
          sub_price: 4000,
          sub_currency: 'ILS',
          sub_iteration_type: 3,
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubscriptionId: 'sub_1' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        {
          seller_payme_id: 'MPL-TEST',
          subscription_id: 'sub_1',
          sub_payme_id: 'SUB-1',
          sub_price: 4000,
          sub_currency: 'ILS',
          sub_iteration_type: 4,
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubscriptionId: 'sub_1' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )
})

test('smoke-test expectedAmountAgorot is server-side metadata only', () => {
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }

  const smokeTestSubscription = {
    seller_payme_id: 'MPL-TEST',
    subscription_id: 'sub_smoke',
    sub_payme_id: 'SUB-SMOKE',
    sub_price: 500,
    sub_currency: 'ILS',
    sub_iteration_type: 3,
    sub_paid: true,
  }

  verifySubscriptionAgainstPlan(smokeTestSubscription, {
    plan: monthly,
    sellerPaymeId: 'MPL-TEST',
    expectedSubscriptionId: 'sub_smoke',
    expectedSubPaymeId: 'SUB-SMOKE',
    expectedAmountAgorot: 500,
  })

  assert.equal(monthly.amountAgorot, 4000)

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(smokeTestSubscription, {
        plan: monthly,
        sellerPaymeId: 'MPL-TEST',
        expectedSubscriptionId: 'sub_smoke',
        expectedSubPaymeId: 'SUB-SMOKE',
      })
    ,
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        { ...smokeTestSubscription, sub_price: 4000 },
        {
          plan: monthly,
          sellerPaymeId: 'MPL-TEST',
          expectedSubscriptionId: 'sub_smoke',
          expectedSubPaymeId: 'SUB-SMOKE',
          expectedAmountAgorot: 500,
        }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySubscriptionAgainstPlan(
        { ...smokeTestSubscription, sub_price: 99 },
        {
          plan: monthly,
          sellerPaymeId: 'MPL-TEST',
          expectedSubscriptionId: 'sub_smoke',
          expectedSubPaymeId: 'SUB-SMOKE',
          expectedAmountAgorot: 500,
        }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )
})

test('S2S transaction happy-path and rejection cases', () => {
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }

  verifySuccessfulTransaction(
    {
      seller_payme_id: 'MPL-TEST',
      sale_status: 'completed',
      transaction_error_code: 20000,
      status_code: 0,
      transaction_price: 4000,
      sale_currency: 'ILS',
      payme_sale_id: 'sale-1',
    },
    { plan: monthly, sellerPaymeId: 'MPL-TEST' }
  )

  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          sale_status: 'pending',
          transaction_error_code: 20000,
          status_code: 0,
          transaction_price: 4000,
          sale_currency: 'ILS',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          sale_status: 'completed',
          transaction_error_code: 20001,
          status_code: 0,
          transaction_price: 4000,
          sale_currency: 'ILS',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST' }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          sale_status: 'completed',
          transaction_error_code: 20000,
          status_code: 0,
          transaction_price: 4000,
          sale_currency: 'ILS',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', alreadyProcessed: true }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  verifySuccessfulTransaction(
    {
      seller_payme_id: 'MPL-TEST',
      sale_status: 'completed',
      transaction_error_code: 20000,
      status_code: 0,
      transaction_price: 500,
      sale_currency: 'ILS',
      payme_sale_id: 'sale-smoke-1',
    },
    { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedAmountAgorot: 500 }
  )

  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          sale_status: 'completed',
          transaction_error_code: 20000,
          status_code: 0,
          transaction_price: 4000,
          sale_currency: 'ILS',
          payme_sale_id: 'sale-smoke-2',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedAmountAgorot: 500 }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )

  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          sale_status: 'completed',
          transaction_error_code: 20000,
          status_code: 0,
          transaction_price: 99,
          sale_currency: 'ILS',
          payme_sale_id: 'sale-smoke-3',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedAmountAgorot: 500 }
      ),
    (error) => error instanceof PaymentError && error.code === 'verification_failed'
  )
})

test('official subscription statuses map to local values', () => {
  assert.equal(isPayMeSubscriptionStatusMappingConfigured(), true)
  assert.equal(mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.initial), 'pending')
  assert.equal(mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.active), 'active')
  assert.equal(mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.paused), 'paused')
  assert.equal(
    mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.failed),
    'payment_failed'
  )
  assert.equal(
    mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.cancelled),
    'cancelled'
  )
  assert.equal(mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.completed), 'expired')
  assert.equal(
    mapPaymeSubscriptionStatus(PAYME_SUB_STATUS.failed_pending_retry),
    'past_due'
  )
  assert.equal(mapPayMeSubStatusToLocal(2), 'active')
  assert.throws(
    () => mapPaymeSubscriptionStatus(99),
    (error) =>
      error instanceof PaymentError && error.code === 'verification_failed'
  )
})

test('official transaction statuses map but are not payment proof alone', () => {
  assert.equal(mapPaymeTransactionStatus(PAYME_TRANSACTION_STATUS.pending), 'pending')
  assert.equal(
    mapPaymeTransactionStatus(PAYME_TRANSACTION_STATUS.validated),
    'validated'
  )
  assert.equal(mapPaymeTransactionStatus(PAYME_TRANSACTION_STATUS.failed), 'failed')
  assert.throws(
    () => mapPaymeTransactionStatus(99),
    (error) =>
      error instanceof PaymentError && error.code === 'verification_failed'
  )

  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }

  // transaction_status=validated alone must not pass happy-path verification.
  assert.throws(
    () =>
      verifySuccessfulTransaction(
        {
          seller_payme_id: 'MPL-TEST',
          transaction_status: PAYME_TRANSACTION_STATUS.validated,
          sale_status: 'pending',
          transaction_error_code: 20000,
          status_code: 0,
          transaction_price: 4000,
          sale_currency: 'ILS',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST' }
      ),
    (error) =>
      error instanceof PaymentError && error.code === 'verification_failed'
  )
})

test('sub_status=2 alone is not enough for active S2S verification', () => {
  const monthly: PaymentPlan = {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: null,
    amountAgorot: 4000,
    currency: 'ILS',
    billingInterval: 'month',
    providerPlanId: null,
  }

  assert.throws(
    () =>
      verifyActiveSubscriptionS2S(
        {
          seller_payme_id: 'MPL-TEST',
          sub_status: 2,
          sub_paid: false,
          sub_price: 4000,
          sub_currency: 'ILS',
          sub_iteration_type: 3,
          sub_payme_id: 'SUB-1',
        },
        { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubPaymeId: 'SUB-1' }
      ),
    (error) =>
      error instanceof PaymentError && error.code === 'verification_failed'
  )

  verifyActiveSubscriptionS2S(
    {
      seller_payme_id: 'MPL-TEST',
      sub_status: 2,
      sub_paid: true,
      sub_price: 4000,
      sub_currency: 'ILS',
      sub_iteration_type: 3,
      sub_payme_id: 'SUB-1',
      payme_sub_code: 123,
    },
    { plan: monthly, sellerPaymeId: 'MPL-TEST', expectedSubPaymeId: 'SUB-1' }
  )
})

test('callback content-type is form-urlencoded and rejects non-matching callbacks', async () => {
  assert.equal(PAYME_CALLBACK_CONTENT_TYPE, 'application/x-www-form-urlencoded')

  await assert.rejects(
    parsePayMeWebhook({
      rawBody: new TextEncoder().encode(
        JSON.stringify({ notify_type: 'sub-create', sub_paid: true })
      ),
      headers: new Headers({ 'content-type': 'application/json' }),
    }),
    (error) => error instanceof PaymentError && error.code === 'invalid_webhook'
  )

  await assert.rejects(
    parsePayMeWebhook({
      rawBody: new TextEncoder().encode('notify_type=sub-create'),
      headers: new Headers({
        'content-type': 'application/x-www-form-urlencoded',
      }),
    }),
    (error) => error instanceof PaymentError && error.code === 'invalid_webhook'
  )
})

test('configured content-type parses but still does not activate without S2S/status mapping', async () => {
  const repository = new MemoryRepository()
  const service = new PaymentService(repository, () => new FakeProvider())
  const raw = new URLSearchParams({
    notify_type: 'sub-iteration-success',
    sub_paid: 'true',
    sub_status: '2',
    sub_payme_id: 'provider-sub-1',
    payme_sale_id: 'sale-1',
    subscription_id: 'sub_local',
  }).toString()
  const event = await parsePayMeWebhook(
    {
      rawBody: new TextEncoder().encode(raw),
      headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
    },
    { configuredContentType: 'application/x-www-form-urlencoded' }
  )
  assert.equal(event.type, 'unknown')
  const result = await service.processNormalizedWebhook(event)
  assert.equal(result.status, 'ignored')
  assert.equal(repository.subscriptions[0].status, 'pending')
})

test('wrong callback content-type is rejected even when another format is configured', async () => {
  await assert.rejects(
    parsePayMeWebhook(
      {
        rawBody: new TextEncoder().encode(
          JSON.stringify({ notify_type: 'sub-create' })
        ),
        headers: new Headers({
          'content-type': 'application/json',
        }),
      },
      { configuredContentType: 'application/x-www-form-urlencoded' }
    ),
    (error) => error instanceof PaymentError && error.code === 'invalid_webhook'
  )
})

test('malformed webhook body is rejected safely when content-type matches', async () => {
  await assert.rejects(
    parsePayMeWebhook(
      {
        rawBody: new TextEncoder().encode('notify_type='),
        headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
      },
      { configuredContentType: 'application/x-www-form-urlencoded' }
    ),
    (error) => error instanceof PaymentError && error.code === 'invalid_webhook'
  )
})

test('first payment handler can apply verified S2S result using PayMe dates only', async () => {
  const repository = new MemoryRepository()
  await handleVerifiedFirstPayment(repository, {
    provider: 'payme',
    userId: 'user-1',
    localSubscriptionId: 'subscription-1',
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
    subPaymeId: 'SUB-1',
    paymeSaleId: 'sale-1',
    subPaymentDate: '2026-08-09 12:00:00',
    subNextDate: '2026-09-09 12:00:00',
    subStartDate: '2026-08-09 12:00:00',
  })
  assert.equal(repository.subscriptions[0].status, 'active')
  assert.equal(repository.subscriptions[0].provider_subscription_id, 'SUB-1')
  assert.equal(repository.subscriptions[0].current_period_end, '2026-09-09 12:00:00')
  assert.equal(repository.subscriptions[0].next_payment_at, '2026-09-09 12:00:00')
  assert.equal(repository.transactions.length, 1)
  assert.equal(repository.transactions[0].externalTransactionId, 'sale-1')
})

test('webhook pipeline remains blocked until callback content-type is confirmed', async () => {
  assert.equal(PAYME_CALLBACK_CONTENT_TYPE, 'application/x-www-form-urlencoded')
  await assert.rejects(
    parsePayMeWebhook({
      rawBody: new TextEncoder().encode(
        JSON.stringify({
          notify_type: 'sub-iteration-success',
          sub_status: 2,
          sub_paid: true,
        })
      ),
      headers: new Headers({ 'content-type': 'application/json' }),
    }),
    (error) => error instanceof PaymentError && error.code === 'invalid_webhook'
  )
})

test('inactive or missing plan is rejected by checkout', async () => {
  const repository = new MemoryRepository()
  const provider = new FakeProvider()
  const service = new PaymentService(repository, () => provider)

  await assert.rejects(
    service.createCheckout({
      userId: 'user-1',
      planCode: 'studio_inactive',
      successUrl: 'https://app.example/success',
      cancelUrl: 'https://app.example/cancel',
    }),
    (error) => error instanceof PaymentError && error.code === 'plan_not_found'
  )

  await assert.rejects(
    service.createCheckout({
      userId: 'user-1',
      planCode: 'does_not_exist',
      successUrl: 'https://app.example/success',
      cancelUrl: 'https://app.example/cancel',
    }),
    (error) => error instanceof PaymentError && error.code === 'plan_not_found'
  )
})

test('proposed yearly migration only seeds studio_yearly', async () => {
  const sql = await readFile(
    path.join(
      root,
      'supabase/migrations/20260809144718_add_studio_yearly_plan.sql'
    ),
    'utf8'
  )
  assert.match(sql, /studio_yearly/)
  assert.match(sql, /40000/)
  assert.match(sql, /'year'/)
  assert.doesNotMatch(sql, /drop table|alter table/i)
})

test('generate-subscription correlation field is wired in source', async () => {
  const generate = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-generate.ts'),
    'utf8'
  )
  const provider = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-provider.ts'),
    'utf8'
  )
  assert.match(generate, /PAYME_CORRELATION_FIELD_NAME = 'subscription_id'/)
  assert.match(generate, /subscription_id: input\.localSubscriptionId/)
  assert.match(provider, /assertGenerateSubscriptionCorrelationReady/)
  assert.match(provider, /postJson<PayMeGenerateSubscriptionResponse>\(\s*'\/generate-subscription'/)
  assert.doesNotMatch(provider, /getSubscriptions\([\s\S]*generate/)
})

test('UI sends only planCode and never client amount', async () => {
  const ui = await readFile(
    path.join(root, 'components/dashboard/SubscriptionBillingPanel.tsx'),
    'utf8'
  )
  assert.match(ui, /planCode:\s*plan\.code/)
  assert.match(ui, /זמין בקרוב/)
  assert.match(ui, /plan\.badge/)
  assert.match(ui, /חיסכון של/)
  assert.match(ui, /לעומת המסלול החודשי/)
  const checkoutCall = ui.match(
    /callAction\(\s*'\/api\/payments\/checkout',\s*\{[\s\S]*?\}\s*\)/
  )?.[0]
  assert.ok(checkoutCall)
  assert.match(checkoutCall, /planCode/)
  assert.doesNotMatch(checkoutCall, /amount|price|agorot/i)
})

test('no production PayMe URL possible in sandbox mode', async () => {
  const client = await readFile(
    path.join(root, 'lib/payments/providers/payme/payme-client.ts'),
    'utf8'
  )
  assert.match(client, /PAYME_LIVE_HOST/)
  assert.match(client, /sandbox\.payme\.io/)
  assert.match(client, /paymeEnv !== 'sandbox'/)
})
