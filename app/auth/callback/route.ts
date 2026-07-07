import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/actions/auth.actions'
import { NextResponse } from 'next/server'

import {
  resolveMvpDashboardPath,
  MVP_DEFAULT_DASHBOARD_PATH,
  ONBOARDING_SETTINGS_PATH,
} from '@/lib/types/app.types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveMvpDashboardPath(
    searchParams.get('next') ?? MVP_DEFAULT_DASHBOARD_PATH
  )
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
        await ensureUserProfile(data.user)
      } catch (profileError) {
        console.error('[auth/callback] ensureUserProfile failed', profileError)
        return NextResponse.redirect(`${origin}/login?error=auth`)
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
