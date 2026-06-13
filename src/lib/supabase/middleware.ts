import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PLATFORM_ADMIN_ROLE } from '@/lib/auth-helpers'
import { getAdminClient } from '@/lib/supabase-admin'
import type { Database } from '@/lib/database.types'

const PLATFORM_PUBLIC_PREFIXES = [
  '/platform/login',
  '/platform/forgot-password',
  '/platform/reset-password',
]

function isPlatformProtectedRoute(pathname: string): boolean {
  if (!pathname.startsWith('/platform')) return false
  return !PLATFORM_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

async function fetchUserRole(authUserId: string): Promise<string | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('users')
    .select('role')
    .eq('auth_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('middleware fetchUserRole:', error.message)
    return null
  }

  return data?.role ?? null
}

function redirectAuthCodeToCallback(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl
  if (pathname === '/auth/callback') return null

  const code = searchParams.get('code')
  if (!code) return null

  const callback = new URL('/auth/callback', request.url)
  for (const [key, value] of searchParams.entries()) {
    callback.searchParams.set(key, value)
  }
  return NextResponse.redirect(callback)
}

export async function updateSupabaseSession(request: NextRequest) {
  const authCodeRedirect = redirectAuthCodeToCallback(request)
  if (authCodeRedirect) return authCodeRedirect

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  if (isPlatformProtectedRoute(pathname)) {
    if (!user) {
      const login = new URL('/platform/login', request.url)
      login.searchParams.set('next', pathname)
      return NextResponse.redirect(login)
    }

    const role = await fetchUserRole(user.id)
    if (role !== PLATFORM_ADMIN_ROLE) {
      const login = new URL('/platform/login', request.url)
      return NextResponse.redirect(login)
    }
  }

  return response
}
