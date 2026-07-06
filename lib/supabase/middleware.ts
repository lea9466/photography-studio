import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'
import {
  MVP_DEFAULT_DASHBOARD_PATH,
  isMvpBlockedDashboardRoute,
  resolveMvpDashboardPath,
} from '@/lib/types/app.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')
  const isResetPasswordRoute = pathname.startsWith('/reset-password')
  const isProtectedRoute = pathname.startsWith('/dashboard')

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = MVP_DEFAULT_DASHBOARD_PATH
    return NextResponse.redirect(url)
  }

  if (user && isMvpBlockedDashboardRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = MVP_DEFAULT_DASHBOARD_PATH
    return NextResponse.redirect(url)
  }

  if (!user && isProtectedRoute) {
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
