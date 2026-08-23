'use server'

import { revalidatePath } from 'next/cache'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { assertFeatureAllowed } from '@/lib/subscriptions/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPersistentRateLimit } from '@/lib/rate-limit/persistent'
import type { CustomDomain } from '@/lib/types/database.types'
import { connectCustomDomainSchema } from '@/lib/validations/domain'
import { attachDomainToProject, detachDomainFromProject, getProjectDomain } from '@/lib/vercel/domains'
import { VercelError } from '@/lib/vercel/errors'

const CONNECT_RATE_LIMIT_MAX_ATTEMPTS = 5
const CONNECT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60

const CHECK_STATUS_RATE_LIMIT_MAX_ATTEMPTS = 30
const CHECK_STATUS_RATE_LIMIT_WINDOW_SECONDS = 60 * 60

/**
 * All reads/writes on custom_domains in this file go through the
 * service-role client, not the caller's RLS-bound one. The table's only RLS
 * policy is an owner-scoped SELECT (see the migration) — there is
 * deliberately no client-writable insert/update/delete policy, since
 * status/vercel_attached must only ever be set after this server has
 * actually confirmed them with Vercel; a client-writable "own row" policy
 * would let a signed-in user set status='active' directly without real
 * verification, and the middleware host lookup would trust it. Every
 * function below re-checks `user_id = userId` explicitly, since the admin
 * client bypasses RLS entirely — that explicit filter is the only ownership
 * enforcement left.
 */
function customDomainsAdmin() {
  return createAdminClient().from('custom_domains')
}

async function revalidateDomainPaths(
  supabase: Awaited<ReturnType<typeof requireDashboardContext>>['supabase'],
  userId: string
) {
  revalidatePath('/dashboard/settings')

  const { data: profile } = await supabase.from('users').select('slug').eq('id', userId).single()

  const slug = (profile as { slug: string | null } | null)?.slug?.trim()
  if (slug) {
    revalidatePath(`/${slug}`)
    revalidatePath(`/${slug}/portfolio`)
    revalidatePath(`/${slug}/blog`)
  }
}

async function getOwnDomainRow(userId: string, domainId: string): Promise<CustomDomain> {
  const { data, error } = await customDomainsAdmin()
    .select('*')
    .eq('id', domainId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('דומיין לא נמצא')
  return data as CustomDomain
}

/**
 * `verified` on Vercel's domain object mainly reflects an ownership-conflict
 * check (is this hostname already claimed by a DIFFERENT Vercel account) —
 * for a domain nobody has added before it's true almost immediately, well
 * before DNS has actually propagated anywhere. It is not a live "is this
 * domain reachable right now" signal (confirmed by hand: a freshly-attached,
 * never-configured domain still 403s at Vercel's edge until its DNS is set).
 * So `status: 'active'` here means "successfully registered with Vercel, no
 * ownership conflict" — the UI sets expectations that DNS propagation is a
 * separate, sometimes-hours-long step after that.
 */
function statusFromVerification(vercelDomain: { verified: boolean }): 'active' | 'pending_dns' {
  return vercelDomain.verified ? 'active' : 'pending_dns'
}

export async function connectCustomDomain(input: unknown) {
  const { userId, supabase } = await requireDashboardContext()
  await assertFeatureAllowed(userId, 'custom_domain')

  const rateLimit = await checkPersistentRateLimit(
    `custom-domain-connect:${userId}`,
    CONNECT_RATE_LIMIT_MAX_ATTEMPTS,
    CONNECT_RATE_LIMIT_WINDOW_SECONDS
  )
  if (!rateLimit.allowed) {
    throw new Error('יותר מדי ניסיונות. נסי שוב מאוחר יותר.')
  }

  const { hostname } = connectCustomDomainSchema.parse(input)

  const { data: existing } = await customDomainsAdmin()
    .select('id, user_id')
    .eq('hostname', hostname)
    .neq('status', 'deleted')
    .maybeSingle()

  if (existing && (existing as { user_id: string }).user_id !== userId) {
    throw new Error('הדומיין הזה כבר מחובר אצל לקוחה אחרת')
  }

  let row: CustomDomain
  if (existing) {
    // Own existing row (a previous pending/error attempt for this same
    // hostname) — reuse it instead of inserting a second row, since the
    // partial unique index (see migration) only allows one non-deleted row
    // per hostname.
    const { data: updated, error: updateError } = await customDomainsAdmin()
      .update({ status: 'pending', last_error: null, updated_at: new Date().toISOString() } as never)
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single()

    if (updateError) throw new Error(updateError.message)
    row = updated as CustomDomain
  } else {
    const { data: inserted, error: insertError } = await customDomainsAdmin()
      .insert({ user_id: userId, hostname, status: 'pending' } as never)
      .select('*')
      .single()

    if (insertError) {
      // 23505 = unique_violation — a concurrent request won the race for
      // this hostname between the check above and this insert.
      if ((insertError as { code?: string }).code === '23505') {
        throw new Error('הדומיין הזה כבר מחובר')
      }
      throw new Error(insertError.message)
    }
    row = inserted as CustomDomain
  }

  try {
    const vercelDomain = await attachDomainToProject(hostname)
    const { data: updated, error: updateError } = await customDomainsAdmin()
      .update({
        status: statusFromVerification(vercelDomain),
        vercel_attached: true,
        vercel_verification: vercelDomain.verification ?? null,
        last_error: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', row.id)
      .select('*')
      .single()

    if (updateError) throw new Error(updateError.message)
    row = updated as CustomDomain
  } catch (error) {
    const message =
      error instanceof VercelError ? error.message : error instanceof Error ? error.message : 'חיבור הדומיין נכשל'
    await customDomainsAdmin()
      .update({ status: 'error', last_error: message, updated_at: new Date().toISOString() } as never)
      .eq('id', row.id)
    throw new Error(message)
  }

  revalidatePath('/dashboard/settings')

  return row
}

export async function checkCustomDomainStatus(domainId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const rateLimit = await checkPersistentRateLimit(
    `custom-domain-check:${userId}`,
    CHECK_STATUS_RATE_LIMIT_MAX_ATTEMPTS,
    CHECK_STATUS_RATE_LIMIT_WINDOW_SECONDS
  )
  if (!rateLimit.allowed) {
    throw new Error('יותר מדי ניסיונות. נסי שוב מאוחר יותר.')
  }

  const row = await getOwnDomainRow(userId, domainId)

  const patch: Record<string, unknown> = {
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    const vercelDomain = await getProjectDomain(row.hostname)
    if (vercelDomain) {
      patch.status = statusFromVerification(vercelDomain)
      patch.vercel_verification = vercelDomain.verification ?? null
      patch.last_error = null
    } else {
      // Detached on Vercel's side outside our flow — surface it rather than
      // silently keep showing a stale "connected" status.
      patch.status = 'error'
      patch.last_error = 'הדומיין אינו מחובר יותר ב-Vercel'
      patch.vercel_attached = false
    }
  } catch (error) {
    patch.last_error = error instanceof Error ? error.message : 'בדיקת הסטטוס נכשלה'
  }

  const { data: updated, error: updateError } = await customDomainsAdmin()
    .update(patch as never)
    .eq('id', domainId)
    .select('*')
    .single()

  if (updateError) throw new Error(updateError.message)

  const result = updated as CustomDomain
  if (result.status === 'active') {
    await revalidateDomainPaths(supabase, userId)
  }

  return result
}

export async function disconnectCustomDomain(domainId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const row = await getOwnDomainRow(userId, domainId)

  if (row.vercel_attached) {
    await detachDomainFromProject(row.hostname)
  }

  const { error: updateError } = await customDomainsAdmin()
    .update({ status: 'deleted', updated_at: new Date().toISOString() } as never)
    .eq('id', domainId)

  if (updateError) throw new Error(updateError.message)

  await revalidateDomainPaths(supabase, userId)

  return { success: true as const }
}
