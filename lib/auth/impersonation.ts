import { cookies } from 'next/headers'

import { getFeedbackEmail } from '@/lib/feedback-email'
import { isAdminAuthenticated } from '@/lib/admin/session'
import { createClient } from '@/lib/supabase/server'
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_AGE_SEC,
  impersonationCookieOptions,
  isValidImpersonationUserId,
} from '@/lib/auth/impersonation-constants'

export {
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_AGE_SEC,
  impersonationCookieOptions,
  isValidImpersonationUserId,
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isPlatformAdminEmail(email: string | null | undefined) {
  if (!email) return false
  return normalizeEmail(email) === normalizeEmail(getFeedbackEmail())
}

export async function getImpersonatedUserIdFromCookies() {
  const cookieStore = await cookies()
  const value = cookieStore.get(IMPERSONATION_COOKIE)?.value?.trim()
  if (!isValidImpersonationUserId(value)) return null
  return value!
}

export async function canUseImpersonation() {
  if (await isAdminAuthenticated()) return true

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return isPlatformAdminEmail(user?.email)
}
