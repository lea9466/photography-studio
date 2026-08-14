import { randomBytes } from 'node:crypto'
import { PaymentError } from './errors'
import {
  isPaymentsCheckoutAllowed,
  isPaymentsCheckoutEnabled,
  isPaymentsSmokeTestUser,
} from './flags'
import { payMeIterationTypeForPlan } from './providers/payme/payme-iteration'
import type { PaymentProvider } from './provider'
import type { BillingRepository } from './repository'
import { SubscriptionService } from './subscription-service'
import type {
  CheckoutSession,
  PaymentPlan,
  PaymentProviderName,
  WebhookEvent,
} from './types'

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

/**
 * A checkout attempt that never returns (browser closed, network drop, user
 * changes their mind) leaves its subscription row stuck in `pending` forever
 * — with nothing to distinguish it from an attempt that's genuinely still in
 * progress. Past this age we treat it as abandoned and let the customer start
 * a fresh checkout rather than being permanently locked out.
 */
const PENDING_CHECKOUT_STALE_MS = 30 * 60 * 1000

function isPendingCheckoutStale(createdAt: string, now = new Date()): boolean {
  return now.getTime() - new Date(createdAt).getTime() > PENDING_CHECKOUT_STALE_MS
}

export type CurrentSubscriptionView = {
  configured: boolean
  /** False until PAYMENTS_CHECKOUT_ENABLED=true after PayMe approval. */
  checkoutEnabled: boolean
  isSmokeTestUser: boolean
  /**
   * False only for a truly active subscription or a pending checkout still
   * within its window — an abandoned/stale pending row does not block a new
   * attempt. See PENDING_CHECKOUT_STALE_MS.
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

    const canStartNewCheckout = !subscription
      ? true
      : subscription.status === 'active'
        ? false
        : subscription.status === 'pending'
          ? isPendingCheckoutStale(subscription.created_at)
          : true

    return {
      configured: true,
      checkoutEnabled: isPaymentsCheckoutAllowed(userId),
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
