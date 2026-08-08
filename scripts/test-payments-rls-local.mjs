#!/usr/bin/env node

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_LOCAL_URL
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error(
    'Set SUPABASE_LOCAL_URL, SUPABASE_LOCAL_ANON_KEY and SUPABASE_LOCAL_SERVICE_ROLE_KEY from `supabase status -o env`.'
  )
}

const parsedUrl = new URL(url)
if (!['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname)) {
  throw new Error('Refusing to run RLS tests against a non-local Supabase URL.')
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const password = `Local-only-${randomUUID()}!`
const suffix = randomUUID()
const emails = [`billing-a-${suffix}@example.test`, `billing-b-${suffix}@example.test`]
const userIds = []
let inactivePlanId = null

function expectNoError(result, label) {
  assert.equal(result.error, null, `${label}: ${result.error?.message}`)
  return result.data
}

function expectDenied(result, label) {
  assert.ok(result.error, `${label}: expected the operation to be denied`)
}

try {
  for (const email of emails) {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Local RLS test' },
    })
    expectNoError(result, `create ${email}`)
    userIds.push(result.data.user.id)
  }

  const plan = expectNoError(
    await admin
      .from('subscription_plans')
      .select('id')
      .eq('code', 'studio_monthly')
      .single(),
    'read seeded plan'
  )

  const inactivePlan = expectNoError(
    await admin
      .from('subscription_plans')
      .insert({
        code: `rls_inactive_${suffix.replaceAll('-', '_')}`,
        name: 'RLS inactive',
        amount_agorot: 1,
        currency: 'ILS',
        billing_interval: 'month',
        is_active: false,
      })
      .select('id')
      .single(),
    'create inactive plan'
  )
  inactivePlanId = inactivePlan.id

  const customerIds = []
  const subscriptionIds = []
  for (const [index, userId] of userIds.entries()) {
    const customer = expectNoError(
      await admin
        .from('billing_customers')
        .insert({
          user_id: userId,
          provider: 'payme',
          provider_customer_id: `local-customer-${index}-${suffix}`,
          email: emails[index],
        })
        .select('id')
        .single(),
      `create customer ${index}`
    )
    customerIds.push(customer.id)

    const subscription = expectNoError(
      await admin
        .from('subscriptions')
        .insert({
          user_id: userId,
          billing_customer_id: customer.id,
          plan_id: plan.id,
          provider: 'payme',
          provider_subscription_id: `local-subscription-${index}-${suffix}`,
          status: 'active',
          provider_metadata: { secret_fixture: index },
        })
        .select('id')
        .single(),
      `create subscription ${index}`
    )
    subscriptionIds.push(subscription.id)

    expectNoError(
      await admin.from('payment_transactions').insert({
        user_id: userId,
        subscription_id: subscription.id,
        provider: 'payme',
        provider_transaction_id: `local-transaction-${index}-${suffix}`,
        status: 'succeeded',
        amount_agorot: 4000,
        currency: 'ILS',
        raw_metadata: { secret_fixture: index },
      }),
      `create transaction ${index}`
    )
  }

  expectNoError(
    await admin.from('payment_webhook_events').insert({
      provider: 'payme',
      provider_event_id: `local-event-${suffix}`,
      event_type: 'payment.succeeded',
      payload: { private_fixture: true },
    }),
    'service role creates webhook event'
  )

  const clients = []
  for (const email of emails) {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    expectNoError(
      await client.auth.signInWithPassword({ email, password }),
      `sign in ${email}`
    )
    clients.push(client)
  }

  const userA = clients[0]
  const safeCustomers = expectNoError(
    await userA
      .from('billing_customers')
      .select('id,user_id,provider,email,created_at,updated_at'),
    'user A reads safe customer fields'
  )
  assert.deepEqual(safeCustomers.map((row) => row.user_id), [userIds[0]])

  const safeSubscriptions = expectNoError(
    await userA.from('subscriptions').select('id,user_id,status,plan_id'),
    'user A reads own subscriptions'
  )
  assert.deepEqual(safeSubscriptions.map((row) => row.user_id), [userIds[0]])

  const safeTransactions = expectNoError(
    await userA
      .from('payment_transactions')
      .select('id,user_id,status,amount_agorot,currency'),
    'user A reads own transactions'
  )
  assert.deepEqual(safeTransactions.map((row) => row.user_id), [userIds[0]])

  expectDenied(
    await userA.from('billing_customers').select('provider_customer_id'),
    'provider customer ID is hidden'
  )
  expectDenied(
    await userA.from('subscriptions').select('provider_metadata'),
    'provider metadata is hidden'
  )
  expectDenied(
    await userA.from('payment_transactions').select('raw_metadata'),
    'raw transaction metadata is hidden'
  )
  expectDenied(
    await userA.from('payment_webhook_events').select('id'),
    'webhook inbox is private'
  )

  const visiblePlans = expectNoError(
    await userA.from('subscription_plans').select('code,is_active'),
    'user A reads active plans'
  )
  assert.ok(visiblePlans.some((row) => row.code === 'studio_monthly'))
  assert.ok(visiblePlans.every((row) => row.is_active))

  expectDenied(
    await userA.from('subscriptions').insert({
      user_id: userIds[0],
      plan_id: plan.id,
      provider: 'payme',
      status: 'active',
    }),
    'client subscription insert'
  )
  expectDenied(
    await userA
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionIds[0]),
    'client subscription status update'
  )
  expectDenied(
    await userA
      .from('subscriptions')
      .update({ provider_metadata: { tampered: true } })
      .eq('id', subscriptionIds[0]),
    'client provider metadata update'
  )
  expectDenied(
    await userA.from('payment_transactions').insert({
      user_id: userIds[0],
      provider: 'payme',
      status: 'succeeded',
      amount_agorot: 1,
      currency: 'ILS',
    }),
    'client transaction insert'
  )
  expectDenied(
    await userA.from('payment_webhook_events').insert({
      provider: 'payme',
      provider_event_id: `forged-${suffix}`,
      event_type: 'payment.succeeded',
      payload: {},
    }),
    'client webhook insert'
  )

  expectNoError(
    await admin
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subscriptionIds[0]),
    'service role updates subscription'
  )

  console.log('Local payment RLS integration checks passed')
} finally {
  if (inactivePlanId) {
    await admin.from('subscription_plans').delete().eq('id', inactivePlanId)
  }
  for (const userId of userIds) {
    await admin.auth.admin.deleteUser(userId)
  }
}
