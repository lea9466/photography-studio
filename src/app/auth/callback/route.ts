import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  cleanNextPath,
  resolvePasswordResetPath,
} from '@/lib/auth-helpers'
import type { Database } from '@/lib/database.types'

function fallbackLogin(next: string): string {
  if (next.startsWith('/platform')) return '/platform/login'
  if (next.startsWith('/studio')) return '/studio/login'
  return '/studio/login'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.trim()
      ? cleanNextPath(rawNext, '/')
      : null

  if (!code) {
    const login = fallbackLogin(next ?? '/')
    return NextResponse.redirect(`${origin}${login}?error=auth`)
  }

  const sessionCookies: {
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }[] = []

  const supabase = createServerClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            sessionCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('auth callback exchangeCodeForSession:', error.message)
    const login = fallbackLogin(next ?? '/')
    return NextResponse.redirect(`${origin}${login}?error=auth`)
  }

  let destination = next
  if (!destination || destination === '/') {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    destination = user ? await resolvePasswordResetPath(user.id) : '/'
  }

  const response = NextResponse.redirect(`${origin}${destination}`)
  sessionCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}
