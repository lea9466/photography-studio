import { createAdminClient } from '@/lib/supabase/admin'
import { withTimeout } from '@/lib/utils/with-timeout'
import {
  GALLERY_SESSION_COOKIE_PREFIX,
  GALLERY_SESSION_IDLE_TIMEOUT_SEC,
  buildGallerySessionToken,
  gallerySessionCookieDomain,
  getGallerySessionSecret,
} from '@/lib/gallery-session-edge'

const GALLERY_PATH_RE =
  /^\/dashboard\/galleries\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i

const OWNER_LOOKUP_TIMEOUT_MS = 3000

export type OwnerGallerySessionCookie = {
  name: string
  value: string
  options: {
    httpOnly: true
    sameSite: 'lax'
    secure: boolean
    maxAge: number
    path: '/'
    domain: string | undefined
  }
}

/**
 * When an authenticated photographer opens one of her OWN private (selection)
 * galleries in the dashboard, hand her browser the same `sg_gallery_<id>`
 * cookie the client gets after the password gate — so the media-guard Worker
 * serves that gallery's media to her over the content-filter-exempt `private.`
 * subdomain, browser-bound, exactly like it does for the client.
 *
 * Returns `null` (mint nothing) for anything else: non-gallery paths, showcase
 * galleries, galleries she doesn't own, when unauthenticated, or when the
 * private subdomain isn't configured.
 *
 * The `user_id` filter IS the authorization: this runs in the middleware,
 * before the page's own `assertGalleryOwner`, so the path must never be
 * trusted on its own.
 */
export async function resolveOwnerGallerySessionCookie(
  pathname: string,
  effectiveUserId: string | null | undefined
): Promise<OwnerGallerySessionCookie | null> {
  if (!effectiveUserId) return null
  if (!process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim()) return null

  const match = pathname.match(GALLERY_PATH_RE)
  if (!match) return null
  const galleryId = match[1]

  try {
    const admin = createAdminClient()
    const query = admin
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .eq('user_id', effectiveUserId)
      .eq('gallery_type', 'selection')
      .maybeSingle()

    const { data } = await withTimeout(query, OWNER_LOOKUP_TIMEOUT_MS, {
      data: null,
    } as Awaited<typeof query>)

    if (!data) return null
  } catch {
    return null
  }

  const expMs = Date.now() + GALLERY_SESSION_IDLE_TIMEOUT_SEC * 1000
  const token = await buildGallerySessionToken(
    galleryId,
    expMs,
    getGallerySessionSecret()
  )

  return {
    name: `${GALLERY_SESSION_COOKIE_PREFIX}${galleryId}`,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: GALLERY_SESSION_IDLE_TIMEOUT_SEC,
      path: '/',
      domain: gallerySessionCookieDomain(),
    },
  }
}
