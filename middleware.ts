import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { NextFetchEvent, NextRequest } from 'next/server'

/**
 * Private galleries are promised (in writing, to a content-filter provider)
 * to live in isolation on their own subdomain — nothing else may be served
 * from it, and old links on the main domain must hand off to it rather than
 * serving the gallery directly. Deliberately dependency-free: middleware
 * runs on the Edge runtime, and anything importing the R2/Supabase admin
 * SDKs (as lib/seo/public-metadata.ts and friends do) would break here.
 */
function getPrivateGalleryHost(): string | null {
  const configured = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim()
  if (!configured) return null
  try {
    const host = new URL(configured).host
    // A misconfigured env var pointing at the main app's own host would
    // make this isolation block 404 almost the entire site. Refuse to
    // activate rather than risk that.
    const appHost = process.env.NEXT_PUBLIC_APP_URL?.trim()
      ? new URL(process.env.NEXT_PUBLIC_APP_URL.trim()).host
      : null
    if (appHost && host === appHost) return null
    return host
  } catch {
    return null
  }
}

const PRIVATE_GALLERY_ALLOWED_PREFIXES = ['/g/', '/_next/', '/api/gallery-media']

function isAllowedOnPrivateGalleryHost(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true
  return PRIVATE_GALLERY_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const privateGalleryHost = getPrivateGalleryHost()

  if (privateGalleryHost) {
    const host = request.headers.get('host')
    const pathname = request.nextUrl.pathname

    if (host === privateGalleryHost) {
      if (!isAllowedOnPrivateGalleryHost(pathname)) {
        return new NextResponse('Not Found', { status: 404 })
      }
    } else if (pathname.startsWith('/g/')) {
      // A private gallery link opened from the main domain (an older email,
      // a bookmark) hands off to the isolated subdomain instead of serving
      // the gallery here.
      const url = request.nextUrl.clone()
      url.host = privateGalleryHost
      url.protocol = 'https:'
      return NextResponse.redirect(url, 308)
    }
  }

  return updateSession(request, event)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
