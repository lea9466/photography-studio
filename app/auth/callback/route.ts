import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import { resolveMvpDashboardPath, MVP_DEFAULT_DASHBOARD_PATH } from '@/lib/types/app.types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveMvpDashboardPath(searchParams.get('next') ?? MVP_DEFAULT_DASHBOARD_PATH)
  const authError = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  if (authError) {
    const loginError =
      errorCode === 'otp_expired' ? 'expired' : 'auth'
    return NextResponse.redirect(`${origin}/login?error=${loginError}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
