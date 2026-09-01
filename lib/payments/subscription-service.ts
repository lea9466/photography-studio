import type { BillingRepository } from './repository'
import type { Subscription } from '@/lib/types/database.types'
import type { WebhookEvent } from './types'

export const PAYMENT_FAILURE_GRACE_PERIOD_DAYS = 7

export type SubscriptionEventResult = 'processed' | 'ignored'

export interface SubscriptionNotifier {
  subscriptionActivated(input: { userId: string; subscriptionId: string }): Promise<void>
  paymentFailed(input: { userId: string; subscriptionId: string }): Promise<void>
  subscriptionCancelled(input: { userId: string; subscriptionId: string }): Promise<void>
}

const noOpNotifier: SubscriptionNotifier = {
  async subscriptionActivated() {},
  async paymentFailed() {},
  async subscriptionCancelled() {},
}

export class SubscriptionService {
  private readonly repository: BillingRepository
  private readonly notifier: SubscriptionNotifier

  constructor(
    repository: BillingRepository,
    notifier: SubscriptionNotifier = noOpNotifier
  ) {
    this.repository = repository
    this.notifier = notifier
  }

  async hasActiveSubscription(userId: string, now = new Date()) {
    const subscription = await this.repository.getCurrentSubscription(userId)
    if (!subscription) return false

    if (subscription.status === 'active') {
      return (
        subscription.current_period_end === null ||
        new Date(subscription.current_period_end).getTime() >= now.getTime()
      )
    }

    if (subscription.status === 'past_due' || subscription.status === 'payment_failed') {
      const graceUntil = new Date(subscription.updated_at)
      graceUntil.setUTCDate(graceUntil.getUTCDate() + PAYMENT_FAILURE_GRACE_PERIOD_DAYS)
      return graceUntil.getTime() >= now.getTime()
    }

    return false
  }

  async handleWebhook(event: WebhookEvent): Promise<SubscriptionEventResult> {
    if (event.type === 'unknown') return 'ignored'

    const subscription = await this.findSubscription(event)
    const userId = subscription?.user_id ?? (await this.resolveUserId(event))

    if (!userId) return 'ignored'

    if (event.type === 'subscription.created') {
      await this.ensureSubscription(event, userId, subscription, 'pending')
      return 'processed'
    }

    if (event.type === 'subscription.activated' || event.type === 'subscription.renewed') {
      const activeSubscription = await this.ensureSubscription(
        event,
        userId,
        subscription,
        'active'
      )
      await this.saveTransactionIfPresent(event, userId, activeSubscription, 'succeeded')
      await this.notifier.subscriptionActivated({
        userId,
        subscriptionId: activeSubscription.id,
      })
      return 'processed'
    }

    if (event.type === 'subscription.payment_failed') {
      if (!subscription) return 'ignored'
      await this.repository.updateSubscription(subscription.id, {
        status: event.data.status === 'past_due' ? 'past_due' : 'payment_failed',
      })
      await this.saveTransactionIfPresent(event, userId, subscription, 'failed')
      await this.notifier.paymentFailed({ userId, subscriptionId: subscription.id })
      return 'processed'
    }

    if (event.type === 'subscription.cancelled') {
      if (!subscription) return 'ignored'
      await this.repository.updateSubscription(subscription.id, {
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        cancelledAt: event.occurredAt,
      })
      await this.notifier.subscriptionCancelled({
        userId,
        subscriptionId: subscription.id,
      })
      return 'processed'
    }

    if (event.type === 'payment.succeeded') {
      if (!subscription) return 'ignored'
      await this.repository.updateSubscription(subscription.id, {
        status: 'active',
        periodStart: event.data.periodStart,
        periodEnd: event.data.periodEnd,
        nextPaymentAt: event.data.nextPaymentAt,
        lastPaymentAt: event.occurredAt,
      })
      await this.saveTransactionIfPresent(event, userId, subscription, 'succeeded')
      return 'processed'
    }

    if (event.type === 'payment.failed') {
      if (!subscription) return 'ignored'
      await this.repository.updateSubscription(subscription.id, {
        status: event.data.status === 'past_due' ? 'past_due' : 'payment_failed',
      })
      await this.saveTransactionIfPresent(event, userId, subscription, 'failed')
      await this.notifier.paymentFailed({ userId, subscriptionId: subscription.id })
      return 'processed'
    }

    if (event.type === 'payment.refunded') {
      await this.saveTransactionIfPresent(event, userId, subscription, 'refunded')
      return 'processed'
    }

    return 'ignored'
  }

  private async findSubscription(event: WebhookEvent) {
    if (!event.externalSubscriptionId) return null
    return this.repository.getSubscriptionByExternalId(
      event.provider,
      event.externalSubscriptionId
    )
  }

  private async resolveUserId(event: WebhookEvent) {
    if (event.externalCustomerId) {
      const customer = await this.repository.getBillingCustomerByExternalId(
        event.provider,
        event.externalCustomerId
      )
      if (customer) return customer.user_id
    }
    return event.data.userId ?? null
  }

  private async ensureSubscription(
    event: WebhookEvent,
    userId: string,
    existing: Subscription | null,
    status: 'pending' | 'active'
  ) {
    if (existing) {
      return this.repository.updateSubscription(existing.id, {
        status,
        periodStart: event.data.periodStart,
        periodEnd: event.data.periodEnd,
        nextPaymentAt: event.data.nextPaymentAt,
        lastPaymentAt: status === 'active' ? event.occurredAt : undefined,
      })
    }

    if (!event.externalSubscriptionId || !event.data.planCode) {
      throw new Error('Verified subscription event is missing local correlation fields')
    }

    const plan = await this.repository.getActivePlanByCode(event.data.planCode)
    if (!plan) throw new Error('Verified subscription event references an unknown plan')

    const customer = event.externalCustomerId
      ? await this.repository.getBillingCustomerByExternalId(
          event.provider,
          event.externalCustomerId
        )
      : null

    return this.repository.upsertSubscription({
      userId,
      planId: plan.id,
      billingCustomerId: customer?.id ?? null,
      provider: event.provider,
      externalSubscriptionId: event.externalSubscriptionId,
      status,
      product: plan.product,
      periodStart: event.data.periodStart,
      periodEnd: event.data.periodEnd,
      nextPaymentAt: event.data.nextPaymentAt,
      metadata: {},
    })
  }

  private async saveTransactionIfPresent(
    event: WebhookEvent,
    userId: string,
    subscription: Subscription | null,
    status: 'succeeded' | 'failed' | 'refunded'
  ) {
    if (
      !event.externalTransactionId ||
      event.data.amountAgorot === undefined ||
      !event.data.currency
    ) {
      return
    }

    await this.repository.upsertTransaction({
      userId,
      subscriptionId: subscription?.id ?? null,
      provider: event.provider,
      externalTransactionId: event.externalTransactionId,
      status,
      amountAgorot: event.data.amountAgorot,
      currency: event.data.currency,
      failureCode: event.data.failureCode,
      failureMessage: event.data.failureMessage,
      paidAt: status === 'succeeded' ? event.occurredAt : null,
      metadata: {},
    })
  }
}
