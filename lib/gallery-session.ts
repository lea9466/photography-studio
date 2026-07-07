import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

import { requireSessionSecret } from '@/lib/session-secret'

const COOKIE_PREFIX = 'sg_gallery_'

function getSecret() {
  return requireSessionSecret('GALLERY_SESSION_SECRET', 'dev-gallery-secret')
}

function signGalleryId(galleryId: string) {
  return createHmac('sha256', getSecret()).update(galleryId).digest('hex')
}

export async function setGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  cookieStore.set(`${COOKIE_PREFIX}${galleryId}`, signGalleryId(galleryId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function hasGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(`${COOKIE_PREFIX}${galleryId}`)?.value
  if (!token) return false

  const expected = signGalleryId(galleryId)
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function clearGallerySession(galleryId: string) {
  const cookieStore = await cookies()
  cookieStore.delete(`${COOKIE_PREFIX}${galleryId}`)
}
