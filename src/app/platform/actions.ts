'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  fetchAppUserByAuthId,
  getPlatformAdminSession,
  isPlatformAdminEmail,
  PLATFORM_ADMIN_ROLE,
  requestSupabasePasswordReset,
  resolvePlatformAdminAuthEmail,
  updateAuthUserPassword,
} from '@/lib/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type PlatformActionResult = { ok: boolean; message: string }

export async function platformLoginAction(
  _prev: PlatformActionResult,
  formData: FormData
): Promise<PlatformActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, message: 'נא למלא אימייל וסיסמה' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { ok: false, message: 'אימייל או סיסמה שגויים' }
  }

  const appUser = await fetchAppUserByAuthId(data.user.id)
  if (!appUser || appUser.role !== PLATFORM_ADMIN_ROLE) {
    await supabase.auth.signOut()
    return { ok: false, message: 'אימייל או סיסמה שגויים' }
  }

  revalidatePath('/platform')
  redirect('/platform')
}

export async function platformLogoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/platform/login')
}

export async function platformForgotPasswordAction(
  _prev: PlatformActionResult,
  formData: FormData
): Promise<PlatformActionResult> {
  const email = String(formData.get('email') ?? '').trim()

  return requestSupabasePasswordReset({
    email,
    nextPath: '/platform/reset-password',
    isEligible: isPlatformAdminEmail,
    resolveAuthEmail: resolvePlatformAdminAuthEmail,
    emailSubject: 'איפוס סיסמה — מנהל פלטפורמה',
  })
}

export async function platformResetPasswordAction(
  _prev: PlatformActionResult,
  formData: FormData
): Promise<PlatformActionResult> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')

  if (password !== confirm) {
    return { ok: false, message: 'הסיסמאות אינן תואמות' }
  }

  return updateAuthUserPassword(password, async () => {
    const session = await getPlatformAdminSession()
    return !!session
  })
}
