import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'
import { fetchWithRetry } from '@/lib/supabase/fetch'
import { recordDashboardVisit } from '@/lib/auth/record-dashboard-visit'
import { shouldRecordDashboardVisit } from '@/lib/auth/should-record-dashboard-visit'
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
import { withTimeout } from '@/lib/utils/with-timeout'
import { resolveCustomDomainSlug, isKnownAppHost } from '@/lib/domains/custom-domain-lookup'
import {
  isBrowserOnlyReservedPath,
  isPassthroughCustomDomainPath,
  resolveCustomDomainRewrite,
  TENANT_HOST_HEADER,
} from '@/lib/domains/rewrite'
import {
  canUseImpersonationFromRequest,
  getImpersonatedUserIdFromRequest,
} from '@/lib/auth/impersonation-middleware'
import {
  DASHBOARD_SUBSCRIPTION_PATH,
  isDashboardSubscriptionPath,
} from '@/lib/site-access/dashboard-lock'
import { resolveOwnerGallerySessionCookie } from '@/lib/studio-gallery-session'

// A slow/degraded Supabase response must never hang this middleware until
// Vercel's own 25s function timeout kills it (see the incident this was
// added for — every call below used to have zero timeout protection, only a
// try/catch that does nothing for a slow-but-eventually-successful
// response). Each call site below falls back to the same safe default it
// already used on a thrown error, just triggered by slowness too now.
const SUPABASE_MIDDLEWARE_TIMEOUT_MS = 4000

export async function updateSession(request: NextRequest, event?: NextFetchEvent) {
  const pathname = request.nextUrl.pathname
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() ?? null
  const isTenantHost = Boolean(host) && !isKnownAppHost(host!)

  // A request arriving on a photographer's own connected domain (DNS pointed
  // directly at Vercel — see lib/vercel/domains.ts) is rewritten to their
  // public site paths here rather than blended into the rest of this
  // function's dashboard/auth logic — the same short-circuit shape as the
  // private-gallery host isolation in the root middleware.ts, just DB-backed
  // since the set of valid tenant hosts is dynamic instead of one configured
  // value.
  if (isTenantHost && !isPassthroughCustomDomainPath(pathname)) {
    if (isBrowserOnlyReservedPath(pathname)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
      if (!appUrl) return new NextResponse('Not Found', { status: 404 })
      const target = new URL(pathname + request.nextUrl.search, appUrl)
      return NextResponse.redirect(target, 308)
    }

    const resolved = await resolveCustomDomainSlug(host!)
    const rewrittenPath = resolved ? resolveCustomDomainRewrite(pathname, resolved.slug) : null
    if (!resolved || !rewrittenPath) return new NextResponse('Not Found', { status: 404 })

    // Verified/DNS-correct but the owner currently has no entitlement (see
    // ResolvedCustomDomain's doc) — send visitors to the equivalent page on
    // the studio-galleries.com/{slug} URL instead of serving the personal
    // domain directly. 307 (temporary): reactivating (resubscribing or
    // buying the addon) flips this back with no lasting SEO signal sent in
    // the meantime — see app/[slug]/*'s canonical logic, which already stops
    // treating a suspended domain as canonical the same way.
    if (resolved.suspended) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
      if (!appUrl) return new NextResponse('Not Found', { status: 404 })
      const target = new URL(rewrittenPath + request.nextUrl.search, appUrl)
      return NextResponse.redirect(target, 307)
    }

    const url = request.nextUrl.clone()
    url.pathname = rewrittenPath
    const headers = new Headers(request.headers)
    headers.set(TENANT_HOST_HEADER, '1')
    return NextResponse.rewrite(url, { request: { headers } })
  }

  if (pathname === '/manage' || pathname.startsWith('/manage/')) {
    return NextResponse.next({ request })
  }

  const studioSlug = parseStudioSlugPath(pathname)

  if (studioSlug) {
    try {
      const newSlug = await withTimeout(
        resolveSlugRedirect(studioSlug),
        SUPABASE_MIDDLEWARE_TIMEOUT_MS,
        null
      )
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
    const authResult = await withTimeout(
      supabase.auth.getUser(),
      SUPABASE_MIDDLEWARE_TIMEOUT_MS,
      null
    )
    user = authResult?.data.user ?? null
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

    const query = supabase.from('users').select('show_welcome_popup').eq('id', user.id).maybeSingle()
    const { data: profile } = await withTimeout(query, SUPABASE_MIDDLEWARE_TIMEOUT_MS, {
      data: null,
    } as Awaited<typeof query>)

    return Boolean(
      (profile as { show_welcome_popup?: boolean } | null)?.show_welcome_popup
    )
  }

  async function userHasSiteUnavailableLock() {
    if (!user) return false
    if (impersonatedUserId && manageAdminSession) return false

    const query = supabase.from('users').select('is_site_unavailable').eq('id', user.id).maybeSingle()
    const { data: profile, error } = await withTimeout(query, SUPABASE_MIDDLEWARE_TIMEOUT_MS, {
      data: null,
      error: null,
    } as Awaited<typeof query>)

    if (error) {
      const message = error.message?.toLowerCase() ?? ''
      if (
        error.code === '42703' ||
        error.code === 'PGRST204' ||
        message.includes('is_site_unavailable')
      ) {
        return false
      }
      return false
    }

    return Boolean(
      (profile as { is_site_unavailable?: boolean } | null)?.is_site_unavailable
    )
  }

  async function resolveAuthenticatedDashboardPath() {
    if (!user) return MVP_DEFAULT_DASHBOARD_PATH

    if (await userHasSiteUnavailableLock()) {
      return DASHBOARD_SUBSCRIPTION_PATH
    }

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
    !isDashboardSubscriptionPath(pathname) &&
    (await userHasSiteUnavailableLock())
  ) {
    const url = request.nextUrl.clone()
    url.pathname = DASHBOARD_SUBSCRIPTION_PATH
    return NextResponse.redirect(url)
  }

  if (
    user &&
    pathname.startsWith('/dashboard') &&
    pathname !== ONBOARDING_SETTINGS_PATH &&
    pathname !== `${ONBOARDING_SETTINGS_PATH}/` &&
    !isDashboardSubscriptionPath(pathname)
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

  const isImpersonating = Boolean(impersonatedUserId) && manageAdminSession
  if (
    user &&
    !isImpersonating &&
    shouldRecordDashboardVisit(request, pathname)
  ) {
    const recordVisit = recordDashboardVisit(user.id)
    if (event?.waitUntil) {
      event.waitUntil(recordVisit)
    } else {
      void recordVisit
    }
  }

  // Owning photographer opening her own private (selection) gallery: give her
  // browser the same sg_gallery_<id> cookie the client gets, so the Worker
  // serves that gallery's media to her over the content-filter-exempt
  // subdomain. No-op for every other path / non-owner / showcase gallery / when
  // the private subdomain isn't configured.
  const effectiveGalleryUserId = isImpersonating ? impersonatedUserId : user?.id
  if (effectiveGalleryUserId && pathname.startsWith('/dashboard/galleries/')) {
    const cookie = await resolveOwnerGallerySessionCookie(
      pathname,
      effectiveGalleryUserId
    )
    if (cookie) {
      supabaseResponse.cookies.set(cookie.name, cookie.value, cookie.options)
    }
  }

  return supabaseResponse
}
