import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BillingCustomer,
  Database,
  Json,
  PaymentTransaction,
  Subscription,
  SubscriptionPlan,
} from '@/lib/types/database.types'
import type {
  PaymentProviderName,
  PaymentStatus,
  SubscriptionStatus,
  WebhookEvent,
} from './types'

type AdminClient = SupabaseClient<Database, 'public'>

export type WebhookClaim = {
  eventId: string
  claimed: boolean
  status: string
}

export interface BillingRepository {
  getUserEmail(userId: string): Promise<string | null>
  getActivePlanByCode(code: string): Promise<SubscriptionPlan | null>
  listActivePlans(): Promise<SubscriptionPlan[]>
  getPlanById(id: string): Promise<SubscriptionPlan | null>
  getBillingCustomer(userId: string, provider: PaymentProviderName): Promise<BillingCustomer | null>
  getBillingCustomerByExternalId(
    provider: PaymentProviderName,
    externalCustomerId: string
  ): Promise<BillingCustomer | null>
  saveBillingCustomer(input: {
    userId: string
    provider: PaymentProviderName
    externalCustomerId: string
    email: string
  }): Promise<BillingCustomer>
  getCurrentSubscription(userId: string): Promise<Subscription | null>
  getSubscriptionByExternalId(
    provider: PaymentProviderName,
    externalSubscriptionId: string
  ): Promise<Subscription | null>
  upsertSubscription(input: {
    userId: string
    planId: string
    billingCustomerId: string | null
    provider: PaymentProviderName
    externalSubscriptionId: string
    status: SubscriptionStatus
    periodStart?: string | null
    periodEnd?: string | null
    nextPaymentAt?: string | null
    cancelAtPeriodEnd?: boolean
    cancelledAt?: string | null
    metadata?: Record<string, unknown>
  }): Promise<Subscription>
  updateSubscription(
    id: string,
    input: {
      status?: SubscriptionStatus
      periodStart?: string | null
      periodEnd?: string | null
      nextPaymentAt?: string | null
      lastPaymentAt?: string | null
      cancelAtPeriodEnd?: boolean
      cancelledAt?: string | null
      providerSubscriptionId?: string | null
    }
  ): Promise<Subscription>
  upsertTransaction(input: {
    userId: string
    subscriptionId: string | null
    provider: PaymentProviderName
    externalTransactionId: string
    status: PaymentStatus
    amountAgorot: number
    currency: string
    failureCode?: string | null
    failureMessage?: string | null
    paidAt?: string | null
    metadata?: Record<string, unknown>
  }): Promise<PaymentTransaction>
  getTransactionByExternalId(
    provider: PaymentProviderName,
    externalTransactionId: string
  ): Promise<PaymentTransaction | null>
  claimWebhook(event: WebhookEvent): Promise<WebhookClaim>
  finishWebhook(eventId: string, status: 'processed' | 'ignored' | 'failed', error?: string): Promise<void>
}

function asJson(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    // Log PostgREST/Supabase error safely for tracing without PII or payloads.
    try {
      const errAny = error as any
      console.error('[payments-trace][db] postgrest-error', {
        step: 'db.throwIfError',
        errorName: errAny?.name ?? 'PostgrestError',
        errorMessage: errAny?.message ?? String(errAny),
        postgrestCode: errAny?.code ?? null,
      })
    } catch (__) {
      console.error('[payments-trace][db] postgrest-error', { step: 'db.throwIfError', errorMessage: 'unknown' })
    }
    throw error
  }
}

export class SupabaseBillingRepository implements BillingRepository {
  constructor(private readonly db: AdminClient) { }

  async getUserEmail(userId: string) {
    const { data, error } = await this.db
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle()
    throwIfError(error)
    return data?.email ?? null
  }

  async getActivePlanByCode(code: string) {
    const { data, error } = await this.db
      .from('subscription_plans')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async listActivePlans() {
    const { data, error } = await this.db
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('amount_agorot', { ascending: true })
    throwIfError(error)
    return data ?? []
  }

  async getPlanById(id: string) {
    const { data, error } = await this.db
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async getBillingCustomer(userId: string, provider: PaymentProviderName) {
    const { data, error } = await this.db
      .from('billing_customers')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async getBillingCustomerByExternalId(
    provider: PaymentProviderName,
    externalCustomerId: string
  ) {
    const { data, error } = await this.db
      .from('billing_customers')
      .select('*')
      .eq('provider', provider)
      .eq('provider_customer_id', externalCustomerId)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async saveBillingCustomer(input: {
    userId: string
    provider: PaymentProviderName
    externalCustomerId: string
    email: string
  }) {
    const { data, error } = await this.db
      .from('billing_customers')
      .upsert(
        {
          user_id: input.userId,
          provider: input.provider,
          provider_customer_id: input.externalCustomerId,
          email: input.email,
        },
        { onConflict: 'user_id,provider' }
      )
      .select('*')
      .single()
    try {
      throwIfError(error)
      if (!data) throw new Error('Billing customer was not saved')
      return data
    } catch (err) {
      console.error('[payments-trace][db] saveBillingCustomer failed', {
        step: 'saveBillingCustomer',
        table: 'billing_customers',
        action: 'upsert',
        correlationId: input?.externalCustomerId ?? null,
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async getCurrentSubscription(userId: string) {
    const { data, error } = await this.db
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    try {
      throwIfError(error)
      return data
    } catch (err) {
      console.error('[payments-trace][db] getCurrentSubscription failed', {
        step: 'getCurrentSubscription',
        table: 'subscriptions',
        action: 'select',
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async getSubscriptionByExternalId(
    provider: PaymentProviderName,
    externalSubscriptionId: string
  ) {
    const { data, error } = await this.db
      .from('subscriptions')
      .select('*')
      .eq('provider', provider)
      .eq('provider_subscription_id', externalSubscriptionId)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async upsertSubscription(input: {
    userId: string
    planId: string
    billingCustomerId: string | null
    provider: PaymentProviderName
    externalSubscriptionId: string
    status: SubscriptionStatus
    periodStart?: string | null
    periodEnd?: string | null
    nextPaymentAt?: string | null
    cancelAtPeriodEnd?: boolean
    cancelledAt?: string | null
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await this.db
      .from('subscriptions')
      .upsert(
        {
          user_id: input.userId,
          plan_id: input.planId,
          billing_customer_id: input.billingCustomerId,
          provider: input.provider,
          provider_subscription_id: input.externalSubscriptionId,
          status: input.status,
          current_period_start: input.periodStart ?? null,
          current_period_end: input.periodEnd ?? null,
          next_payment_at: input.nextPaymentAt ?? null,
          cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
          cancelled_at: input.cancelledAt ?? null,
          provider_metadata: asJson(input.metadata ?? {}),
        },
        { onConflict: 'provider,provider_subscription_id' }
      )
      .select('*')
      .single()
    try {
      throwIfError(error)
      if (!data) throw new Error('Subscription was not saved')
      return data
    } catch (err) {
      console.error('[payments-trace][db] upsertSubscription failed', {
        step: 'upsertSubscription',
        table: 'subscriptions',
        action: 'upsert',
        correlationId: input?.externalSubscriptionId ?? null,
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async updateSubscription(
    id: string,
    input: {
      status?: SubscriptionStatus
      periodStart?: string | null
      periodEnd?: string | null
      nextPaymentAt?: string | null
      lastPaymentAt?: string | null
      cancelAtPeriodEnd?: boolean
      cancelledAt?: string | null
      providerSubscriptionId?: string | null
    }
  ) {
    const update: Database['public']['Tables']['subscriptions']['Update'] = {}
    if (input.status !== undefined) update.status = input.status
    if (input.periodStart !== undefined) update.current_period_start = input.periodStart
    if (input.periodEnd !== undefined) update.current_period_end = input.periodEnd
    if (input.nextPaymentAt !== undefined) update.next_payment_at = input.nextPaymentAt
    if (input.lastPaymentAt !== undefined) update.last_payment_at = input.lastPaymentAt
    if (input.cancelAtPeriodEnd !== undefined) update.cancel_at_period_end = input.cancelAtPeriodEnd
    if (input.cancelledAt !== undefined) update.cancelled_at = input.cancelledAt
    if (input.providerSubscriptionId !== undefined) {
      update.provider_subscription_id = input.providerSubscriptionId
    }

    const { data, error } = await this.db
      .from('subscriptions')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()
    try {
      throwIfError(error)
      if (!data) throw new Error('Subscription was not updated')
      return data
    } catch (err) {
      console.error('[payments-trace][db] updateSubscription failed', {
        step: 'updateSubscription',
        table: 'subscriptions',
        action: 'update',
        id,
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async upsertTransaction(input: {
    userId: string
    subscriptionId: string | null
    provider: PaymentProviderName
    externalTransactionId: string
    status: PaymentStatus
    amountAgorot: number
    currency: string
    failureCode?: string | null
    failureMessage?: string | null
    paidAt?: string | null
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await this.db
      .from('payment_transactions')
      .upsert(
        {
          user_id: input.userId,
          subscription_id: input.subscriptionId,
          provider: input.provider,
          provider_transaction_id: input.externalTransactionId,
          status: input.status,
          amount_agorot: input.amountAgorot,
          currency: input.currency,
          failure_code: input.failureCode ?? null,
          failure_message: input.failureMessage ?? null,
          paid_at: input.paidAt ?? null,
          raw_metadata: asJson(input.metadata ?? {}),
        },
        { onConflict: 'provider,provider_transaction_id' }
      )
      .select('*')
      .single()
    try {
      throwIfError(error)
      if (!data) throw new Error('Payment transaction was not saved')
      return data
    } catch (err) {
      console.error('[payments-trace][db] upsertTransaction failed', {
        step: 'upsertTransaction',
        table: 'payment_transactions',
        action: 'upsert',
        correlationId: input?.externalTransactionId ?? null,
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  async getTransactionByExternalId(
    provider: PaymentProviderName,
    externalTransactionId: string
  ) {
    const { data, error } = await this.db
      .from('payment_transactions')
      .select('*')
      .eq('provider', provider)
      .eq('provider_transaction_id', externalTransactionId)
      .maybeSingle()
    throwIfError(error)
    return data
  }

  async claimWebhook(event: WebhookEvent) {
    const { data, error } = await this.db
      .rpc('claim_payment_webhook_event', {
        p_provider: event.provider,
        p_provider_event_id: event.id,
        p_event_type: event.type,
        p_payload: asJson(event.rawPayload),
      })
      .single()
    throwIfError(error)
    if (!data) throw new Error('Webhook event was not claimed')
    return {
      eventId: data.webhook_event_id,
      claimed: data.claimed,
      status: data.current_status,
    }
  }

  async finishWebhook(
    eventId: string,
    status: 'processed' | 'ignored' | 'failed',
    error?: string
  ) {
    const { error: updateError } = await this.db
      .from('payment_webhook_events')
      .update({
        processing_status: status,
        processing_error: error?.slice(0, 500) ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId)
    try {
      throwIfError(updateError)
    } catch (err) {
      console.error('[payments-trace][db] finishWebhook failed', {
        step: 'finishWebhook',
        table: 'payment_webhook_events',
        action: 'update',
        eventId,
        errorName: err instanceof Error ? err.name : 'Error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }
}
