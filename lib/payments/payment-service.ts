import { randomBytes } from 'node:crypto'
import { PaymentError } from './errors'
import {
  isOneTimePaymentEnabled,
  isPaymentsCheckoutAllowed,
  isPaymentsCheckoutEnabled,
  isPaymentsMaintenance,
  isPaymentsSmokeTestUser,
  isSumitPaymentsJsEnabled,
} from './flags'
import { payMeIterationTypeForPlan } from './providers/payme/payme-iteration'
import { SumitProvider } from './providers/sumit/sumit-provider'
import type { PaymentProvider } from './provider'
import type { BillingRepository } from './repository'
import { SubscriptionService } from './subscription-service'
import type {
  CheckoutSession,
  PaymentCustomer,
  PaymentPlan,
  PaymentProviderName,
  WebhookEvent,
} from './types'
import {
  CUSTOM_DOMAIN_ADDON_ITEM_NAME,
  CUSTOM_DOMAIN_ADDON_PRICE_AGOROT,
} from '@/lib/domains/custom-domain-addon'
import { reactivateSuspendedCustomDomains } from '@/lib/domains/custom-domain-suspension'

export type PaymentLogger = {
  info(message: string, context?: Record<string, string | boolean | null>): void
  error(message: string, context?: Record<string, string | boolean | null>): void
}

const safeLogger: PaymentLogger = {
  info(message, context) {
    console.info(`[payments] ${message}`, context ?? {})
  },
  error(message, context) {
    console.error(`[payments] ${message}`, context ?? {})
  },
}

export type PlanView = {
  code: string
  name: string
  amountAgorot: number
  currency: string
  billingInterval: string
  /** Display-only "official" price shown struck-through. Null = no discount. */
  compareAtAgorot: number | null
  /** Short label shown on the plan card (e.g. "מחיר השקה מיוחד"). */
  badge: string | null
  /** When true the plan card is visually emphasized. */
  isHighlighted: boolean
}

export type CurrentSubscriptionView = {
  configured: boolean
  /** False until PAYMENTS_CHECKOUT_ENABLED=true after PayMe approval. */
  checkoutEnabled: boolean
  /** True when the one-time-payment fallback (for cards like "דיירקט" that
   *  reject a recurring authorization) is available. */
  oneTimePaymentEnabled: boolean
  /** True when the in-site SUMIT PaymentsJS card form is live (real recurring
   *  subscriptions). While false the plan card falls back to the one-time flow. */
  paymentsFormEnabled: boolean
  /** True while the whole self-serve payment area is down for maintenance. */
  maintenance: boolean
  isSmokeTestUser: boolean
  /**
   * False only for a genuinely active subscription. A `pending` row never
   * blocks a new attempt, at any age — a checkout that never returns
   * (closed tab, changed mind) must not lock the customer out forever, and
   * multiple pending rows are harmless: only the one specific attempt that's
   * actually verified server-to-server (via the provider callback) ever
   * activates a subscription or charges a card. The button's own in-flight
   * lock already prevents an accidental real double-click.
   */
  canStartNewCheckout: boolean
  subscription: {
    id: string
    status: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    nextPaymentAt: string | null
    lastPaymentAt: string | null
    cancelAtPeriodEnd: boolean
    paymentType: 'recurring' | 'one_time'
    plan: PlanView
  } | null
  /** @deprecated prefer availablePlans — kept for compatibility */
  availablePlan: PlanView | null
  availablePlans: PlanView[]
}

export class PaymentService {
  private readonly subscriptions: SubscriptionService
  private readonly repository: BillingRepository
  private readonly resolveProvider: (name?: PaymentProviderName) => PaymentProvider
  private readonly logger: PaymentLogger

  constructor(
    repository: BillingRepository,
    resolveProvider: (name?: PaymentProviderName) => PaymentProvider,
    logger: PaymentLogger = safeLogger
  ) {
    this.repository = repository
    this.resolveProvider = resolveProvider
    this.logger = logger
    this.subscriptions = new SubscriptionService(repository)
  }

  async createCheckout(input: {
    userId: string
    planCode: string
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const provider = this.resolveProvider()
    const planRow = await this.repository.getActivePlanByCode(input.planCode)
    if (!planRow) throw new PaymentError('plan_not_found')

    const plan = toPaymentPlan(planRow)
    const email = await this.repository.getUserEmail(input.userId)
    if (!email) throw new PaymentError('invalid_request')

    let customerRow = await this.repository.getBillingCustomer(input.userId, provider.name)
    let customer = customerRow?.provider_customer_id
      ? {
        id: customerRow.provider_customer_id,
        provider: provider.name,
        email: customerRow.email,
      }
      : null

    if (!customer) {
      customer = await provider.createCustomer({ userId: input.userId, email })
      customerRow = await this.repository.saveBillingCustomer({
        userId: input.userId,
        provider: provider.name,
        externalCustomerId: customer.id,
        email,
      })
    }

    const localSubscriptionId = `sub_${randomBytes(16).toString('hex')}`
    const isSmokeTest =
      !isPaymentsCheckoutEnabled() &&
      isPaymentsSmokeTestUser(input.userId) &&
      plan.code === 'studio_monthly'

    // Pending local row + correlation id are prepared before the provider call.
    // generate-subscription remains blocked until the correlation field name is confirmed.
    await this.repository.upsertSubscription({
      userId: input.userId,
      planId: plan.id,
      billingCustomerId: customerRow?.id ?? null,
      provider: provider.name,
      externalSubscriptionId: localSubscriptionId,
      status: 'pending',
      metadata: {
        local_subscription_id: localSubscriptionId,
        plan_code: plan.code,
        amount_agorot: plan.amountAgorot,
        currency: plan.currency,
        billing_interval: plan.billingInterval,
        ...(isSmokeTest
          ? {
            smoke_test: true,
            smoke_test_price_agorot: 500,
            smoke_test_iterations: 1,
            smoke_test_iteration_type: payMeIterationTypeForPlan(plan),
          }
          : {}),
      },
    })

    this.logger.info('creating checkout', {
      provider: provider.name,
      userId: input.userId,
      planCode: plan.code,
    })

    return provider.createCheckoutSession({
      userId: input.userId,
      customer,
      plan,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      localSubscriptionId,
      smokeTest: isSmokeTest
        ? {
          priceAgorot: 500,
          iterations: 1,
          iterationType: payMeIterationTypeForPlan(plan),
        }
        : undefined,
    })
  }

  /**
   * Standalone one-time ₪99 checkout that unlocks custom_domain independent
   * of subscription tier (lib/subscriptions/entitlements.ts's buildFeatures)
   * — SUMIT-only by design (the feature was requested and verified live on
   * SUMIT specifically; no PayMe equivalent exists or is planned). Not part
   * of the generic `PaymentProvider` interface for the same reason
   * `createAddonCheckout` lives directly on `SumitProvider` rather than it —
   * see that method's doc comment.
   */
  async createCustomDomainAddonCheckout(input: {
    userId: string
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const provider = this.resolveProvider()
    if (!(provider instanceof SumitProvider)) {
      throw new PaymentError('provider_not_configured')
    }

    const email = await this.repository.getUserEmail(input.userId)
    if (!email) throw new PaymentError('invalid_request')

    let customerRow = await this.repository.getBillingCustomer(input.userId, provider.name)
    let customer: PaymentCustomer | null = customerRow?.provider_customer_id
      ? { id: customerRow.provider_customer_id, provider: provider.name, email: customerRow.email }
      : null

    if (!customer) {
      customer = await provider.createCustomer({ userId: input.userId, email })
      customerRow = await this.repository.saveBillingCustomer({
        userId: input.userId,
        provider: provider.name,
        externalCustomerId: customer.id,
        email,
      })
    }

    this.logger.info('creating custom-domain addon checkout', {
      provider: provider.name,
      userId: input.userId,
    })

    return provider.createAddonCheckout({
      customerId: customer.id,
      itemName: CUSTOM_DOMAIN_ADDON_ITEM_NAME,
      amountAgorot: CUSTOM_DOMAIN_ADDON_PRICE_AGOROT,
      currency: 'ILS',
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    })
  }

  /**
   * SUMIT PaymentsJS recurring flow: the client tokenizes the card in-site and
   * sends us a single-use `token`; one `provider.createSubscription` call both
   * charges it and opens the standing order. Replaces the broken redirect
   * two-step. On success the local row goes straight to `active` (no callback
   * round-trip) and a `succeeded` transaction is recorded; on failure the row
   * stays `pending`, a `failed` transaction is recorded, and the SUMIT error
   * message is surfaced to the client.
   */
  async subscribeWithToken(input: {
    userId: string
    planCode: string
    token: string
  }): Promise<CurrentSubscriptionView> {
    const provider = this.resolveProvider()
    const planRow = await this.repository.getActivePlanByCode(input.planCode)
    if (!planRow) throw new PaymentError('plan_not_found')
    const plan = toPaymentPlan(planRow)

    const email = await this.repository.getUserEmail(input.userId)
    if (!email) throw new PaymentError('invalid_request')

    // Resolve-or-create the provider customer (same block as createCheckout).
    let customerRow = await this.repository.getBillingCustomer(input.userId, provider.name)
    let customer = customerRow?.provider_customer_id
      ? { id: customerRow.provider_customer_id, provider: provider.name, email: customerRow.email }
      : null
    if (!customer) {
      customer = await provider.createCustomer({ userId: input.userId, email })
      customerRow = await this.repository.saveBillingCustomer({
        userId: input.userId,
        provider: provider.name,
        externalCustomerId: customer.id,
        email,
      })
    }

    const localSubscriptionId = `sub_${randomBytes(16).toString('hex')}`
    const now = new Date()
    const periodEnd = new Date(now)
    if (plan.billingInterval === 'year') {
      periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1)
    } else {
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)
    }

    await this.repository.upsertSubscription({
      userId: input.userId,
      planId: plan.id,
      billingCustomerId: customerRow?.id ?? null,
      provider: provider.name,
      externalSubscriptionId: localSubscriptionId,
      status: 'pending',
      metadata: {
        local_subscription_id: localSubscriptionId,
        plan_code: plan.code,
        amount_agorot: plan.amountAgorot,
        currency: plan.currency,
        billing_interval: plan.billingInterval,
        flow: 'paymentsjs',
      },
    })

    const row = await this.repository.getSubscriptionByExternalId(
      provider.name,
      localSubscriptionId
    )
    if (!row) throw new PaymentError('internal_error')

    this.logger.info('creating paymentsjs subscription', {
      provider: provider.name,
      userId: input.userId,
      planCode: plan.code,
    })

    let subscription
    try {
      subscription = await provider.createSubscription({
        customerId: customer.id,
        plan,
        paymentToken: input.token,
      })
    } catch (error) {
      await this.repository
        .upsertTransaction({
          userId: input.userId,
          subscriptionId: row.id,
          provider: provider.name,
          externalTransactionId: `${localSubscriptionId}:failed`,
          status: 'failed',
          amountAgorot: plan.amountAgorot,
          currency: plan.currency,
          failureCode: error instanceof PaymentError ? error.code : 'charge_failed',
          failureMessage:
            error instanceof Error ? error.message.slice(0, 500) : String(error),
        })
        .catch(() => {})
      throw error
    }

    await this.repository.updateSubscription(row.id, {
      status: subscription.status,
      periodStart: now.toISOString(),
      periodEnd: subscription.currentPeriodEnd ?? periodEnd.toISOString(),
      nextPaymentAt: subscription.nextPaymentAt ?? periodEnd.toISOString(),
      lastPaymentAt: now.toISOString(),
      providerSubscriptionId: subscription.id,
    })

    const paymentId = subscription.metadata?.payment_id
    await this.repository
      .upsertTransaction({
        userId: input.userId,
        subscriptionId: row.id,
        provider: provider.name,
        externalTransactionId:
          paymentId != null ? String(paymentId) : `${localSubscriptionId}:charge`,
        status: 'succeeded',
        amountAgorot: plan.amountAgorot,
        currency: plan.currency,
        paidAt: now.toISOString(),
        metadata: { recurring_item_id: subscription.metadata?.recurring_item_id ?? null },
      })
      .catch((error) => {
        this.logger.error('paymentsjs transaction record failed', {
          userId: input.userId,
          message: error instanceof Error ? error.message : String(error),
        })
      })

    // See the matching comment on handleCheckout in the SUMIT return route.
    if (subscription.status === 'active') {
      await reactivateSuspendedCustomDomains(input.userId)
    }

    return this.getCurrentSubscription(input.userId)
  }

  /**
   * Single charge, no standing authorization — for customers whose card
   * cannot hold one (e.g. immediate-debit "דיירקט" cards, which reject the
   * regular flow's recurring-authorization request). Priced off the monthly
   * plan's per-month rate times `months` (1 = "monthly", 12 = "yearly", or any
   * custom count the customer wants to prepay) rather than a fixed catalog
   * plan — there is no separate "one-time yearly" row, `months` covers both
   * and everything in between. Mirrors `createCheckout` except it calls
   * `createOneTimeCheckoutSession` and tags the pending row
   * `payment_type: 'one_time'` so the reminder/expiry cron and access checks
   * treat it as a lapsing grant instead of an auto-renewing subscription.
   */
  async createOneTimeCheckout(input: {
    userId: string
    months: number
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const months = Math.trunc(input.months)
    if (!Number.isFinite(months) || months < 1 || months > 24) {
      throw new PaymentError('invalid_request')
    }

    const provider = this.resolveProvider()
    const monthlyPlanRow = await this.repository.getActivePlanByCode('studio_monthly')
    if (!monthlyPlanRow) throw new PaymentError('plan_not_found')

    // 12 months prices exactly like the yearly plan (the catalog's discounted
    // rate), not monthlyPlan × 12 — a one-time year shouldn't cost more than
    // committing to the recurring yearly plan would. Every other count is
    // priced off the monthly rate, months === 1 included.
    const yearlyPlanRow =
      months === 12 ? await this.repository.getActivePlanByCode('studio_yearly') : null
    const priceRow = yearlyPlanRow ?? monthlyPlanRow

    const email = await this.repository.getUserEmail(input.userId)
    if (!email) throw new PaymentError('invalid_request')

    let customerRow = await this.repository.getBillingCustomer(input.userId, provider.name)
    let customer = customerRow?.provider_customer_id
      ? {
        id: customerRow.provider_customer_id,
        provider: provider.name,
        email: customerRow.email,
      }
      : null

    if (!customer) {
      customer = await provider.createCustomer({ userId: input.userId, email })
      customerRow = await this.repository.saveBillingCustomer({
        userId: input.userId,
        provider: provider.name,
        externalCustomerId: customer.id,
        email,
      })
    }

    const amountAgorot =
      yearlyPlanRow ? yearlyPlanRow.amount_agorot : monthlyPlanRow.amount_agorot * months
    const plan: PaymentPlan = {
      id: priceRow.id,
      code: priceRow.code,
      name:
        yearlyPlanRow
          ? yearlyPlanRow.name
          : months === 1
            ? monthlyPlanRow.name
            : `${monthlyPlanRow.name} — תשלום חד-פעמי ל-${months} חודשים`,
      description: priceRow.description,
      amountAgorot,
      currency: priceRow.currency,
      billingInterval: priceRow.billing_interval,
      providerPlanId: priceRow.provider_plan_id,
    }

    const localSubscriptionId = `sub_${randomBytes(16).toString('hex')}`

    await this.repository.upsertSubscription({
      userId: input.userId,
      planId: priceRow.id,
      billingCustomerId: customerRow?.id ?? null,
      provider: provider.name,
      externalSubscriptionId: localSubscriptionId,
      status: 'pending',
      paymentType: 'one_time',
      metadata: {
        local_subscription_id: localSubscriptionId,
        plan_code: plan.code,
        amount_agorot: amountAgorot,
        currency: plan.currency,
        one_time_months: months,
      },
    })

    this.logger.info('creating one-time checkout', {
      provider: provider.name,
      userId: input.userId,
      planCode: plan.code,
    })

    return provider.createOneTimeCheckoutSession({
      userId: input.userId,
      customer,
      plan,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      localSubscriptionId,
    })
  }

  async createSubscription(input: {
    userId: string
    planCode: string
    paymentToken?: string
  }) {
    const provider = this.resolveProvider()
    const planRow = await this.repository.getActivePlanByCode(input.planCode)
    if (!planRow) throw new PaymentError('plan_not_found')

    const customer = await this.repository.getBillingCustomer(input.userId, provider.name)
    if (!customer?.provider_customer_id) throw new PaymentError('invalid_request')

    return provider.createSubscription({
      customerId: customer.provider_customer_id,
      plan: toPaymentPlan(planRow),
      paymentToken: input.paymentToken,
    })
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.repository.getCurrentSubscription(userId)
    if (
      !subscription ||
      subscription.user_id !== userId ||
      !subscription.provider_subscription_id
    ) {
      throw new PaymentError('subscription_not_found')
    }
    if (subscription.status === 'pending') {
      throw new PaymentError('subscription_not_active')
    }

    const provider = this.resolveProvider(subscription.provider as PaymentProviderName)
    const cancelled = await provider.cancelSubscription({
      externalSubscriptionId: subscription.provider_subscription_id,
      atPeriodEnd: true,
    })

    await this.repository.updateSubscription(subscription.id, {
      status: cancelled.status,
      cancelAtPeriodEnd: cancelled.cancelAtPeriodEnd,
      cancelledAt: cancelled.cancelledAt,
    })

    return cancelled
  }

  async updatePaymentMethod(userId: string, returnUrl: string) {
    const subscription = await this.repository.getCurrentSubscription(userId)
    if (
      !subscription ||
      subscription.user_id !== userId ||
      !subscription.provider_subscription_id
    ) {
      throw new PaymentError('subscription_not_found')
    }
    if (subscription.status === 'pending') {
      throw new PaymentError('subscription_not_active')
    }

    const provider = this.resolveProvider(subscription.provider as PaymentProviderName)
    const customer = await this.repository.getBillingCustomer(userId, provider.name)
    if (!customer?.provider_customer_id) throw new PaymentError('invalid_request')

    const planRow = subscription.plan_id
      ? await this.repository.getPlanById(subscription.plan_id)
      : null
    if (!planRow) throw new PaymentError('plan_not_found')
    const plan = toPaymentPlan(planRow)

    return provider.updatePaymentMethod({
      externalCustomerId: customer.provider_customer_id,
      externalSubscriptionId: subscription.provider_subscription_id,
      returnUrl,
      plan,
    })
  }

  async getCurrentSubscription(userId: string): Promise<CurrentSubscriptionView> {
    const [subscription, availablePlans] = await Promise.all([
      this.repository.getCurrentSubscription(userId),
      this.repository.listActivePlans(),
    ])

    const plan = subscription
      ? await this.repository.getPlanById(subscription.plan_id)
      : null

    const planViews = availablePlans.map(toPlanView)

    const canStartNewCheckout = subscription?.status !== 'active'

    return {
      configured: true,
      checkoutEnabled: isPaymentsCheckoutAllowed(userId),
      oneTimePaymentEnabled: isOneTimePaymentEnabled(),
      paymentsFormEnabled: isSumitPaymentsJsEnabled(),
      maintenance: isPaymentsMaintenance(userId),
      isSmokeTestUser: isPaymentsSmokeTestUser(userId),
      canStartNewCheckout,
      subscription:
        subscription && plan
          ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            nextPaymentAt: subscription.next_payment_at,
            lastPaymentAt: subscription.last_payment_at,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            paymentType: subscription.payment_type,
            plan: toPlanView(plan),
          }
          : null,
      availablePlan: planViews[0] ?? null,
      availablePlans: planViews,
    }
  }

  async hasActiveSubscription(userId: string) {
    return this.subscriptions.hasActiveSubscription(userId)
  }

  /**
   * Activates the local pending subscription by verifying it against PayMe via a
   * server-to-server lookup (using the local correlation id). This is the safe
   * alternative to an unverified webhook callback and is triggered when the user
   * returns from PayMe. Returns the refreshed subscription view.
   */
  async verifySubscription(userId: string): Promise<CurrentSubscriptionView> {
    const subscription = await this.repository.getCurrentSubscription(userId)
    if (!subscription || subscription.user_id !== userId) {
      return this.getCurrentSubscription(userId)
    }

    const localId = subscription.provider_subscription_id
    const alreadyReal =
      localId && !localId.startsWith('sub_') && subscription.status === 'active'
    if (alreadyReal) {
      return this.getCurrentSubscription(userId)
    }

    // Try every pending local subscription (most recent first) until PayMe
    // confirms one. This tolerates multiple abandoned checkout attempts.
    const all = await this.repository.getSubscriptions(userId)
    const pending = all.filter(
      (s) =>
        s.provider_subscription_id?.startsWith('sub_') && s.status === 'pending'
    )
    const provider = this.resolveProvider(
      subscription.provider as PaymentProviderName
    )

    for (const candidate of pending) {
      const verified = await provider.verifySubscriptionByCorrelation(
        candidate.provider_subscription_id as string
      )
      if (!verified) continue

      await this.repository.updateSubscription(candidate.id, {
        status: verified.status,
        periodStart: verified.currentPeriodStart,
        periodEnd: verified.currentPeriodEnd,
        nextPaymentAt: verified.nextPaymentAt,
        lastPaymentAt: new Date().toISOString(),
        providerSubscriptionId: verified.id,
      })
      return this.getCurrentSubscription(userId)
    }

    return this.getCurrentSubscription(userId)
  }

  async processWebhook(input: {
    providerName: PaymentProviderName
    rawBody: Uint8Array
    headers: Headers
  }) {
    const provider = this.resolveProvider(input.providerName)
    const event = await provider.parseWebhook({
      rawBody: input.rawBody,
      headers: input.headers,
    })
    return this.processNormalizedWebhook(event)
  }

  async processNormalizedWebhook(event: WebhookEvent) {
    const claim = await this.repository.claimWebhook(event)
    if (!claim.claimed) {
      this.logger.info('duplicate webhook skipped', {
        provider: event.provider,
        eventId: event.id,
      })
      return { duplicate: true, status: claim.status }
    }

    try {
      const result = await this.subscriptions.handleWebhook(event)
      await this.repository.finishWebhook(
        claim.eventId,
        result === 'ignored' ? 'ignored' : 'processed'
      )
      return { duplicate: false, status: result }
    } catch (error) {
      await this.repository.finishWebhook(
        claim.eventId,
        'failed',
        error instanceof Error ? error.message : 'Webhook processing failed'
      )
      this.logger.error('webhook processing failed', {
        provider: event.provider,
        eventId: event.id,
      })
      throw error
    }
  }
}

function toPaymentPlan(row: {
  id: string
  code: string
  name: string
  description: string | null
  amount_agorot: number
  currency: string
  billing_interval: 'month' | 'year'
  provider_plan_id: string | null
}): PaymentPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    amountAgorot: row.amount_agorot,
    currency: row.currency,
    billingInterval: row.billing_interval,
    providerPlanId: row.provider_plan_id,
  }
}

function toPlanView(row: {
  code: string
  name: string
  amount_agorot: number
  currency: string
  billing_interval: string
  compare_at_amount_agorot?: number | null
  badge?: string | null
  is_highlighted?: boolean
}): PlanView {
  return {
    code: row.code,
    name: row.name,
    amountAgorot: row.amount_agorot,
    currency: row.currency,
    billingInterval: row.billing_interval,
    compareAtAgorot: row.compare_at_amount_agorot ?? null,
    badge: row.badge ?? null,
    isHighlighted: Boolean(row.is_highlighted),
  }
}
