'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createPhotographerTenant,
  normalizeSlug,
  slugFromEmail,
} from '@/lib/photographer-onboarding'
import {
  fetchPhotographerByAuthUserId,
  getPhotographerSession,
  isPhotographerAuthEmail,
  requestSupabasePasswordReset,
  resolvePhotographerAuthEmail,
  updateAuthUserPassword,
} from '@/lib/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type StudioActionResult = { ok: boolean; message: string }

function cleanNext(raw: string | null): string {
  const value = (raw ?? '').trim()
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/admin'
  }
  return value
}

export async function studioLoginAction(
  _prev: StudioActionResult,
  formData: FormData
): Promise<StudioActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = cleanNext(String(formData.get('next') ?? ''))

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

  const photographer = await fetchPhotographerByAuthUserId(data.user.id)
  if (!photographer) {
    redirect(`/studio/signup?email=${encodeURIComponent(email)}&linked=1`)
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function studioSignupAction(
  _prev: StudioActionResult,
  formData: FormData
): Promise<StudioActionResult> {
  const displayName = String(formData.get('display_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const slugInput = String(formData.get('slug') ?? '').trim()
  const slug = slugInput ? normalizeSlug(slugInput) : slugFromEmail(email)

  if (!displayName || !email) {
    return { ok: false, message: 'נא למלא שם ואימייל' }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      message: 'כתובת האתר (slug) — אותיות אנגליות קטנות, מספרים ומקף בלבד',
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: existingUser } = await supabase.auth.getUser()

  let authUserId = existingUser.user?.id ?? null

  if (!authUserId) {
    if (!password) {
      return { ok: false, message: 'נא למלא סיסמה' }
    }
    if (password.length < 6) {
      return { ok: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים' }
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return { ok: false, message: error.message }
    }
    if (!data.user) {
      return { ok: false, message: 'שגיאה ביצירת משתמש' }
    }
    authUserId = data.user.id

    if (!data.session) {
      const login = await supabase.auth.signInWithPassword({ email, password })
      if (login.error) {
        return {
          ok: false,
          message:
            'נרשמתם בהצלחה — אשרו את האימייל ואז התחברו מחדש',
        }
      }
    }
  }

  const tenant = await createPhotographerTenant({
    authUserId,
    email,
    displayName,
    slug,
  })

  if (tenant.error) {
    return { ok: false, message: tenant.error }
  }

  revalidatePath('/', 'layout')
  redirect(`/${tenant.slug}?welcome=1`)
}

export async function studioLogoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/studio/login')
}

export async function studioForgotPasswordAction(
  _prev: StudioActionResult,
  formData: FormData
): Promise<StudioActionResult> {
  const email = String(formData.get('email') ?? '').trim()

  return requestSupabasePasswordReset({
    email,
    nextPath: '/studio/reset-password',
    isEligible: isPhotographerAuthEmail,
    resolveAuthEmail: resolvePhotographerAuthEmail,
    emailSubject: 'איפוס סיסמה — סטודיו צילום',
  })
}

export async function studioResetPasswordAction(
  _prev: StudioActionResult,
  formData: FormData
): Promise<StudioActionResult> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')

  if (password !== confirm) {
    return { ok: false, message: 'הסיסמאות אינן תואמות' }
  }

  return updateAuthUserPassword(password, async () => {
    const session = await getPhotographerSession()
    return !!session
  })
}
