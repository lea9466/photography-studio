import { updateSession } from '@/lib/supabase/middleware'
import type { NextFetchEvent, NextRequest } from 'next/server'

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  return updateSession(request, event)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
