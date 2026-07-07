'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotographerPasswordResetEmail } from '@/lib/email/resend'
import {
  MVP_DEFAULT_DASHBOARD_PATH,
  ONBOARDING_SETTINGS_PATH,
  resolveMvpDashboardPath,
} from '@/lib/types/app.types'
import { applyReferralOnSignup } from '@/lib/referral/referral'
import { randomBytes } from 'node:crypto'

export type AuthActionState = {
  error?: string
  success?: string
}

function mapSignInError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('email not confirmed')) {
    return 'יש לאמת את האימייל לפני ההתחברות — בדקי את תיבת הדואר (גם ספאם)'
  }
  if (lower.includes('invalid login credentials')) {
    return 'אימייל או סיסמה שגויים'
  }
  if (lower.includes('database error')) {
    return 'שגיאת מסד נתונים — ייתכן שה-migrations לא הורצו ב-Supabase'
  }
  return message
}

function mapSignUpError(message: string): string {
  if (message.toLowerCase().includes('database error')) {
    return 'שגיאה ביצירת פרופיל — הריצי את ה-migrations ב-Supabase (SQL Editor)'
  }
  return message
}

function readOAuthDisplayName(user: User, metaName?: string) {
  if (metaName?.trim()) return metaName.trim()

  const metadata = user.user_metadata ?? {}
  if (typeof metadata.name === 'string' && metadata.name.trim()) {
    return metadata.name.trim()
  }
  if (typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
    return metadata.full_name.trim()
  }

  return user.email?.split('@')[0] ?? 'User'
}

function readOAuthAvatarUrl(user: User) {
  const metadata = user.user_metadata ?? {}
  if (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) {
    return metadata.avatar_url.trim()
  }
  if (typeof metadata.picture === 'string' && metadata.picture.trim()) {
    return metadata.picture.trim()
  }
  return null
}

export async function ensureUserProfile(
  user: User,
  meta?: { name?: string; studio_name?: string | null; logo_url?: string | null }
) {
  const supabase = await createClient()
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id, email, name, logo_url')
    .eq('id', user.id)
    .maybeSingle()

  const existing = existingProfile as {
    id: string
    email: string | null
    name: string | null
    logo_url: string | null
  } | null

  const name = readOAuthDisplayName(user, meta?.name)
  const studioName =
    meta?.studio_name ??
    (typeof user.user_metadata?.studio_name === 'string'
      ? user.user_metadata.studio_name
      : null)
  const logoUrl = meta?.logo_url ?? readOAuthAvatarUrl(user)

  if (existing) {
    const updates: {
      email?: string | null
      name?: string
      logo_url?: string | null
    } = {}

    if (user.email && !existing.email) updates.email = user.email
    if (name && !existing.name) updates.name = name
    if (logoUrl && !existing.logo_url) updates.logo_url = logoUrl

    if (Object.keys(updates).length === 0) return

    const { error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    name,
    studio_name: studioName,
    logo_url: logoUrl,
    show_welcome_popup: true,
  } as never)

  if (error) {
    if (error.message.includes('does not exist')) {
      throw new Error(
        'טבלאות המערכת לא קיימות — הריצי את קבצי ה-migration ב-Supabase SQL Editor'
      )
    }
    throw new Error(error.message)
  }
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = resolveMvpDashboardPath(String(formData.get('next') ?? MVP_DEFAULT_DASHBOARD_PATH))

  if (!email || !password) {
    return { error: 'נא למלא אימייל וסיסמה' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: mapSignInError(error.message) }
  }

  try {
    await ensureUserProfile(data.user)
  } catch (profileError) {
    return {
      error:
        profileError instanceof Error
          ? profileError.message
          : 'שגיאה ביצירת פרופיל',
    }
  }

  revalidatePath('/', 'layout')
  redirect(resolveMvpDashboardPath(next))
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
  refFromRoute?: string
): Promise<AuthActionState> {
  const name = String(formData.get('name') ?? '').trim()
  const studioName = String(formData.get('studio_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!name || !email || !password) {
    return { error: 'נא למלא שם, אימייל וסיסמה' }
  }

  if (password.length < 8) {
    return { error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        name,
        studio_name: studioName || null,
      },
    },
  })

  if (error) {
    return { error: mapSignUpError(error.message) }
  }

  // Supabase returns empty identities when email is already registered
  if (data.user?.identities?.length === 0) {
    return {
      error:
        'האימייל כבר רשום — נסי להתחבר עם אותה סיסמה, או השתמשי באימייל אחר.',
    }
  }

  let user = data.user
  let session = data.session

  // When confirm-email is off but no session returned, sign in immediately
  if (!session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      return {
        error: mapSignInError(signInError.message),
        success:
          signInError.message.toLowerCase().includes('email not confirmed')
            ? 'אם ביטלת אימות מייל — מחקי את המשתמש הישן ב-Supabase Dashboard → Authentication → Users'
            : undefined,
      }
    }

    user = signInData.user
    session = signInData.session
  }

  if (!user || !session) {
    return {
      success:
        'נשלח מייל לאימות. לחצי על הקישור במייל ואז התחברי עם אותה סיסמה.',
    }
  }

  try {
    await ensureUserProfile(user, {
      name,
      studio_name: studioName || null,
    })
  } catch (profileError) {
    return {
      error:
        profileError instanceof Error
          ? profileError.message
          : 'שגיאה ביצירת פרופיל',
    }
  }

  const ref = (refFromRoute ?? String(formData.get('ref') ?? '')).trim()
  if (ref) {
    try {
      await applyReferralOnSignup(user.id, ref)
    } catch (referralError) {
      console.error('[signUp] referral apply failed', referralError)
    }
  }

  revalidatePath('/', 'layout')
  redirect(ONBOARDING_SETTINGS_PATH)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

function createTemporaryPassword() {
  return randomBytes(9).toString('base64url')
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim()

  if (!email) {
    return { error: 'נא להזין אימייל' }
  }

  try {
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('id, email, name')
      .ilike('email', email)
      .maybeSingle()

    if (!profile?.email) {
      return {
        success:
          'אם האימייל רשום במערכת, נשלח אליו סיסמה חדשה — בדקי את תיבת הדואר (גם ספאם)',
      }
    }

    const newPassword = createTemporaryPassword()
    const { error: updateError } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[password reset] updateUserById failed', updateError)
      return { error: 'לא הצלחנו לאפס את הסיסמה — נסי שוב מאוחר יותר' }
    }

    await sendPhotographerPasswordResetEmail({
      email: profile.email,
      name: profile.name ?? profile.email.split('@')[0] ?? 'צלמת',
      password: newPassword,
    })
  } catch (err) {
    console.error('[password reset]', err)
    return {
      error:
        err instanceof Error
          ? err.message
          : 'שליחת המייל נכשלה — נסי שוב מאוחר יותר',
    }
  }

  return {
    success:
      'נשלח מייל עם סיסמה חדשה — בדקי את תיבת הדואר (גם בתיקיית הספאם)',
  }
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (!password || !confirmPassword) {
    return { error: 'נא למלא את שני שדות הסיסמה' }
  }

  if (password.length < 8) {
    return { error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }
  }

  if (password !== confirmPassword) {
    return { error: 'הסיסמאות אינן תואמות' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'קישור השחזור פג תוקף — בקשי מייל חדש' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(MVP_DEFAULT_DASHBOARD_PATH)
}

export async function resendConfirmationEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) {
    return { error: 'נא להזין אימייל' }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'מייל אימות נשלח שוב — בדקי את תיבת הדואר' }
}
