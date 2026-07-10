import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'
import { fetchWithRetry } from '@/lib/supabase/fetch'
import {
  MVP_DEFAULT_DASHBOARD_PATH,
  ONBOARDING_SETTINGS_PATH,
  isMvpBlockedDashboardRoute,
  resolveMvpDashboardPath,
} from '@/lib/types/app.types'
import {
  parseStudioSlugPath,
  resolveSlugRedirect,
} from '@/lib/referral/slug-redirect'
import {
  canUseImpersonationFromRequest,
  getImpersonatedUserIdFromRequest,
} from '@/lib/auth/impersonation-middleware'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/manage' || pathname.startsWith('/manage/')) {
    return NextResponse.next({ request })
  }

  const studioSlug = parseStudioSlugPath(pathname)

  if (studioSlug) {
    try {
      const newSlug = await resolveSlugRedirect(studioSlug)
      if (newSlug) {
        const url = request.nextUrl.clone()
        url.pathname = `/${encodeURIComponent(newSlug)}`
        return NextResponse.redirect(url, 301)
      }
    } catch {
      // Continue to normal routing if redirect lookup fails
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithRetry,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null

  try {
    const authResult = await supabase.auth.getUser()
    user = authResult.data.user
  } catch {
    return supabaseResponse
  }

  const impersonatedUserId = getImpersonatedUserIdFromRequest(request)
  const manageAdminSession = await canUseImpersonationFromRequest(request)
  const hasImpersonationAccess =
    Boolean(impersonatedUserId) && manageAdminSession && !user

  async function userNeedsWelcomePopup() {
    if (!user) return false
    if (impersonatedUserId && manageAdminSession) return false

    const { data: profile } = await supabase
      .from('users')
      .select('show_welcome_popup')
      .eq('id', user.id)
      .maybeSingle()

    return Boolean(
      (profile as { show_welcome_popup?: boolean } | null)?.show_welcome_popup
    )
  }

  async function resolveAuthenticatedDashboardPath() {
    if (!user) return MVP_DEFAULT_DASHBOARD_PATH

    if (await userNeedsWelcomePopup()) {
      return ONBOARDING_SETTINGS_PATH
    }

    return MVP_DEFAULT_DASHBOARD_PATH
  }

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')
  const isResetPasswordRoute = pathname.startsWith('/reset-password')
  const isProtectedRoute = pathname.startsWith('/dashboard')

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = await resolveAuthenticatedDashboardPath()
    return NextResponse.redirect(url)
  }

  if (user && isMvpBlockedDashboardRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = await resolveAuthenticatedDashboardPath()
    return NextResponse.redirect(url)
  }

  if (
    user &&
    pathname.startsWith('/dashboard') &&
    pathname !== ONBOARDING_SETTINGS_PATH &&
    pathname !== `${ONBOARDING_SETTINGS_PATH}/`
  ) {
    if (await userNeedsWelcomePopup()) {
      const url = request.nextUrl.clone()
      url.pathname = ONBOARDING_SETTINGS_PATH
      return NextResponse.redirect(url)
    }
  }

  if (!user && isProtectedRoute && !hasImpersonationAccess) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', resolveMvpDashboardPath(pathname))
    return NextResponse.redirect(url)
  }

  if (!user && isResetPasswordRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/forgot-password'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
