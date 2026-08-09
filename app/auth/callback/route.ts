import { createClient } from '@/lib/supabase/server'
import {
  ensureUserProfile,
  maybeSendWelcomeEmailForCurrentUser,
} from '@/lib/auth/user-profile'
import { applyReferralOnSignup } from '@/lib/referral/referral'
import { NextResponse } from 'next/server'

import {
  resolveMvpDashboardPath,
  MVP_DEFAULT_DASHBOARD_PATH,
  ONBOARDING_SETTINGS_PATH,
} from '@/lib/types/app.types'

const NEW_OAUTH_USER_WINDOW_MS = 15 * 60 * 1000

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveMvpDashboardPath(
    searchParams.get('next') ?? MVP_DEFAULT_DASHBOARD_PATH
  )
  const referralCode = searchParams.get('ref')?.trim() ?? ''
  const authError = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  if (authError) {
    const loginError =
      errorCode === 'otp_expired' ? 'expired' : 'auth'
    return NextResponse.redirect(`${origin}/login?error=${loginError}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      try {
        await ensureUserProfile()
        await maybeSendWelcomeEmailForCurrentUser()
      } catch (profileError) {
        console.error('[auth/callback] ensureUserProfile failed', {
          message:
            profileError instanceof Error ? profileError.message : 'unknown',
        })
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }

      if (referralCode) {
        const createdAtMs = new Date(data.user.created_at).getTime()
        const isNewOAuthUser =
          Number.isFinite(createdAtMs) &&
          Date.now() - createdAtMs < NEW_OAUTH_USER_WINDOW_MS

        if (isNewOAuthUser) {
          try {
            await applyReferralOnSignup(data.user.id, referralCode)
          } catch (referralError) {
            console.error('[auth/callback] referral apply failed', referralError)
          }
        }
      }

      const { data: profile } = await supabase
        .from('users')
        .select('show_welcome_popup')
        .eq('id', data.user.id)
        .maybeSingle()

      const destination =
        (profile as { show_welcome_popup?: boolean } | null)?.show_welcome_popup
          ? ONBOARDING_SETTINGS_PATH
          : next

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
