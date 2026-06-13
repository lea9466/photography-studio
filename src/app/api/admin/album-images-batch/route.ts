import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminInsertImagesBatch } from '@/lib/admin-db'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

const BATCH_MAX = 50

function shouldSkipRevalidate(request: Request): boolean {
  return request.headers.get('x-skip-revalidate') === '1'
}

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const record = body as Record<string, unknown>
  const albumId = String(record.album_id ?? '').trim()
  const rawImages = record.images

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'חסר מערך images' },
      { status: 400 }
    )
  }

  if (rawImages.length > BATCH_MAX) {
    return NextResponse.json(
      { ok: false, message: `מקסימום ${BATCH_MAX} תמונות בבקשה` },
      { status: 400 }
    )
  }

  const items: { imageUrl: string; thumbnailUrl: string }[] = []
  for (const entry of rawImages) {
    const row = entry as Record<string, unknown>
    const imageUrl = String(row.image_url ?? '').trim()
    const thumbnailUrl = String(row.thumbnail_url ?? '').trim()
    if (!imageUrl || !thumbnailUrl) {
      return NextResponse.json(
        { ok: false, message: 'כל פריט חייב image_url ו-thumbnail_url' },
        { status: 400 }
      )
    }
    items.push({ imageUrl, thumbnailUrl })
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { error, inserted } = await adminInsertImagesBatch(albumId, items)
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  if (!shouldSkipRevalidate(request)) {
    revalidatePath('/admin')
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/gallery')
    revalidatePath('/contact')
  }

  return NextResponse.json({
    ok: true,
    message: `${inserted} תמונות נרשמו`,
    inserted,
  })
}
