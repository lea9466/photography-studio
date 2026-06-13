import 'server-only'

import type { User } from '@supabase/supabase-js'
import type { PhotographersRow, UsersRow } from '@/lib/database.types'
import { appBaseUrl, isEmailConfigured, sendAuthRecoveryEmail } from '@/lib/email'
import { getAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const PLATFORM_ADMIN_ROLE = 'platform_admin'

export const GENERIC_RESET_MESSAGE =
  'אם האימייל רשום במערכת, נשלחו הוראות למייל שלכם.'

export function authCallbackUrl(next: string): string {
  const base = appBaseUrl()
  const path = next.startsWith('/') ? next : `/${next}`
  return `${base}/auth/callback?next=${encodeURIComponent(path)}`
}

/** כש-Supabase מפנה ל-Site URL בלבד (?code= על /), נחשב את יעד האיפוס לפי תפקיד. */
export async function resolvePasswordResetPath(
  authUserId: string
): Promise<string> {
  const sb = getAdminClient()
  if (!sb) return '/studio/reset-password'

  const { data: appUser } = await sb
    .from('users')
    .select('role')
    .eq('auth_id', authUserId)
    .maybeSingle()

  if (appUser?.role === PLATFORM_ADMIN_ROLE) {
    return '/platform/reset-password'
  }

  const { data: photographer } = await sb
    .from('photographers')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (photographer) return '/studio/reset-password'

  return '/'
}

export function cleanNextPath(raw: string | null, fallback: string): string {
  const value = (raw ?? '').trim()
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }
  return value
}

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export async function fetchAppUserByAuthId(
  authUserId: string
): Promise<UsersRow | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('fetchAppUserByAuthId:', error.message)
    return null
  }

  return data
}

export async function isPlatformAdminEmail(email: string): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false

  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  const { data, error } = await sb
    .from('users')
    .select('id')
    .ilike('email', normalized)
    .eq('role', PLATFORM_ADMIN_ROLE)
    .maybeSingle()

  if (error) {
    console.error('isPlatformAdminEmail:', error.message)
    return false
  }

  return !!data
}

export async function isPhotographerAuthEmail(email: string): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false

  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  const { data: photographer, error: photographerError } = await sb
    .from('photographers')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle()

  if (photographerError) {
    console.error('isPhotographerAuthEmail:', photographerError.message)
    return false
  }

  if (photographer) return true

  const { data: authData, error: authError } =
    await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (authError) {
    console.error('isPhotographerAuthEmail listUsers:', authError.message)
    return false
  }

  const authUser = authData.users.find(
    (user) => user.email?.trim().toLowerCase() === normalized
  )
  if (!authUser) return false

  const linked = await fetchPhotographerByAuthUserId(authUser.id)
  return !!linked
}

export async function resolvePlatformAdminAuthEmail(
  email: string
): Promise<string | null> {
  if (!(await isPlatformAdminEmail(email))) return null

  const sb = getAdminClient()
  if (!sb) return null

  const normalized = email.trim().toLowerCase()
  const { data, error } = await sb
    .from('users')
    .select('auth_id, email')
    .ilike('email', normalized)
    .eq('role', PLATFORM_ADMIN_ROLE)
    .maybeSingle()

  if (error || !data?.auth_id) return null

  const { data: authData, error: authError } = await sb.auth.admin.getUserById(
    data.auth_id
  )
  if (authError || !authData?.user?.email) {
    return data.email?.trim().toLowerCase() ?? null
  }

  return authData.user.email.trim().toLowerCase()
}

export async function resolvePhotographerAuthEmail(
  email: string
): Promise<string | null> {
  if (!(await isPhotographerAuthEmail(email))) return null

  const sb = getAdminClient()
  if (!sb) return null

  const normalized = email.trim().toLowerCase()
  const { data: photographer } = await sb
    .from('photographers')
    .select('auth_user_id, email')
    .ilike('email', normalized)
    .maybeSingle()

  if (photographer?.auth_user_id) {
    const { data: authData, error: authError } = await sb.auth.admin.getUserById(
      photographer.auth_user_id
    )
    if (!authError && authData?.user?.email) {
      return authData.user.email.trim().toLowerCase()
    }
  }

  return normalized
}

export async function getPlatformAdminSession(): Promise<{
  user: User
  email: string
} | null> {
  const user = await getAuthUser()
  if (!user) return null

  const appUser = await fetchAppUserByAuthId(user.id)
  if (!appUser || appUser.role !== PLATFORM_ADMIN_ROLE) return null

  return {
    user,
    email: appUser.email?.trim() || user.email?.trim() || '',
  }
}

export async function requestSupabasePasswordReset(args: {
  email: string
  nextPath: string
  isEligible: (email: string) => Promise<boolean>
  resolveAuthEmail?: (email: string) => Promise<string | null>
  emailSubject?: string
}): Promise<{ ok: boolean; message: string }> {
  const normalized = args.email.trim().toLowerCase()
  if (!normalized) {
    return { ok: false, message: 'נא להזין אימייל' }
  }

  if (!(await args.isEligible(normalized))) {
    return { ok: true, message: GENERIC_RESET_MESSAGE }
  }

  const authEmail = args.resolveAuthEmail
    ? await args.resolveAuthEmail(normalized)
    : normalized

  if (!authEmail) {
    return { ok: true, message: GENERIC_RESET_MESSAGE }
  }

  const redirectTo = authCallbackUrl(args.nextPath)

  if (isEmailConfigured()) {
    const sb = getAdminClient()
    if (sb) {
      const { data, error } = await sb.auth.admin.generateLink({
        type: 'recovery',
        email: authEmail,
        options: { redirectTo },
      })

      const resetUrl = data?.properties?.action_link
      if (!error && resetUrl) {
        const sent = await sendAuthRecoveryEmail({
          to: authEmail,
          resetUrl,
          subject: args.emailSubject ?? 'איפוס סיסמה',
        })

        if (sent.ok) {
          return { ok: true, message: GENERIC_RESET_MESSAGE }
        }

        console.error('sendAuthRecoveryEmail:', sent.error)
      } else if (error) {
        console.error('generateLink recovery:', error.message)
        return { ok: true, message: GENERIC_RESET_MESSAGE }
      }
    }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
    redirectTo,
  })

  if (process.env.NODE_ENV === 'development') {
    console.info('resetPasswordForEmail redirectTo:', redirectTo)
  }

  if (error) {
    console.error('resetPasswordForEmail:', error.message)
    return { ok: false, message: 'שגיאה בשליחת קישור האיפוס' }
  }

  return { ok: true, message: GENERIC_RESET_MESSAGE }
}

export async function updateAuthUserPassword(
  password: string,
  isAllowed: () => Promise<boolean>
): Promise<{ ok: boolean; message: string }> {
  if (password.length < 6) {
    return { ok: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים' }
  }

  const user = await getAuthUser()
  if (!user) {
    return {
      ok: false,
      message: 'הקישור אינו תקין או שפג תוקפו — בקשו איפוס מחדש',
    }
  }

  if (!(await isAllowed())) {
    return { ok: false, message: 'אין הרשאה לעדכן סיסמה בחשבון זה' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('updateUser password:', error.message)
    return { ok: false, message: error.message }
  }

  return { ok: true, message: 'הסיסמה עודכנה בהצלחה — אפשר להתחבר' }
}

export async function fetchPhotographerByAuthUserId(
  authUserId: string
): Promise<PhotographersRow | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('photographers')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('fetchPhotographerByAuthUserId:', error.message)
    return null
  }
  return data
}

export async function getPhotographerSession(): Promise<{
  user: User
  photographer: PhotographersRow
} | null> {
  const user = await getAuthUser()
  if (!user) return null

  const photographer = await fetchPhotographerByAuthUserId(user.id)
  if (!photographer) return null

  return { user, photographer }
}
