import 'server-only'

import {
  appBaseUrl,
  isEmailConfigured,
  sendClientAccessCodeEmail,
} from '@/lib/email'
import { GENERIC_RESET_MESSAGE } from '@/lib/auth-helpers'
import { generateAccessCode, generateResetToken } from '@/lib/password-hash'
import { getAdminClient } from '@/lib/supabase-admin'
import { tenantPath } from '@/lib/tenant-paths'
import { createHash } from 'crypto'

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function isRateLimited(
  email: string,
  scope: 'client'
): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return true

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count, error } = await sb
    .from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('scope', scope)
    .gte('created_at', since)

  if (error) {
    console.error('rate limit check:', error.message)
    return true
  }

  return (count ?? 0) >= RATE_LIMIT_MAX
}

async function storeResetToken(args: {
  email: string
  scope: 'client'
  photographerId?: string | null
}): Promise<void> {
  const sb = getAdminClient()
  if (!sb) return

  const token = generateResetToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error } = await sb.from('password_reset_tokens').insert({
    email: args.email,
    token_hash: tokenHash,
    scope: args.scope,
    photographer_id: args.photographerId ?? null,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('store reset token:', error.message)
  }
}

export async function requestClientCodeReset(args: {
  email: string
  photographerId: string
  photographerSlug: string
  studioName: string
}): Promise<{ ok: boolean; message: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, message: 'שליחת מייל אינה מוגדרת כרגע' }
  }

  const normalized = args.email.trim().toLowerCase()
  if (!normalized) {
    return { ok: false, message: 'נא להזין אימייל' }
  }

  const rateKey = `${normalized}:${args.photographerId}`
  if (await isRateLimited(rateKey, 'client')) {
    return { ok: true, message: GENERIC_RESET_MESSAGE }
  }

  const sb = getAdminClient()
  if (!sb) return { ok: false, message: 'אין חיבור למערכת' }

  const { data: user } = await sb
    .from('users')
    .select('id, email, role')
    .ilike('email', normalized)
    .eq('role', 'client')
    .maybeSingle()

  if (!user) {
    return { ok: true, message: GENERIC_RESET_MESSAGE }
  }

  const { data: client } = await sb
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .eq('photographer_id', args.photographerId)
    .maybeSingle()

  if (!client) {
    return { ok: true, message: GENERIC_RESET_MESSAGE }
  }

  const newCode = generateAccessCode()
  const { error: updateError } = await sb
    .from('users')
    .update({ access_code: newCode })
    .eq('id', user.id)

  if (updateError) {
    console.error('update client access code:', updateError.message)
    return { ok: false, message: 'שגיאה בעדכון קוד הגישה' }
  }

  await storeResetToken({
    email: rateKey,
    scope: 'client',
    photographerId: args.photographerId,
  })

  const loginUrl = `${appBaseUrl()}${tenantPath(args.photographerSlug, '/client')}`
  const sent = await sendClientAccessCodeEmail({
    to: user.email?.trim() || normalized,
    accessCode: newCode,
    studioName: args.studioName,
    loginUrl,
  })

  if (!sent.ok) {
    return { ok: false, message: sent.error ?? 'שגיאה בשליחת המייל' }
  }

  return { ok: true, message: GENERIC_RESET_MESSAGE }
}
