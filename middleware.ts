import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  decidePrivateGalleryRouting,
  getPrivateGalleryHost,
} from '@/lib/private-gallery/isolation'
import type { NextFetchEvent, NextRequest } from 'next/server'

/**
 * Private galleries are promised (in writing, to a content-filter provider)
 * to live in isolation on their own subdomain — nothing else may be served
 * from it, and old links on the main domain must hand off to it rather than
 * serving the gallery directly. The routing decision itself lives in the
 * dependency-free lib/private-gallery/isolation.ts so it stays unit-testable
 * (scripts/test-private-gallery-isolation.ts) and Edge-safe.
 */
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const routing = decidePrivateGalleryRouting(
    request.headers.get('host'),
    request.nextUrl.pathname,
    getPrivateGalleryHost()
  )

  if (routing.action === 'block') {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (routing.action === 'redirect') {
    // A private gallery link opened from the main domain (an older email, a
    // bookmark) hands off to the isolated subdomain instead of serving the
    // gallery here.
    const url = request.nextUrl.clone()
    url.host = routing.host
    url.protocol = 'https:'
    return NextResponse.redirect(url, 308)
  }

  return updateSession(request, event)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
