import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
  verifyImageIdsBelongToAlbum,
} from '@/lib/api-auth-helpers'
import { adminMarkImagesReady } from '@/lib/admin-db'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

const BATCH_MAX = 50

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
  const albumId = String(record.album_id ?? record.albumId ?? '').trim()
  const rawIds = record.image_ids ?? record.imageIds

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'חסר מערך image_ids' },
      { status: 400 }
    )
  }

  if (rawIds.length > BATCH_MAX) {
    return NextResponse.json(
      { ok: false, message: `מקסימום ${BATCH_MAX} תמונות בבקשה` },
      { status: 400 }
    )
  }

  const imageIds = rawIds.map((id) => String(id).trim()).filter(Boolean)

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const ownership = await verifyImageIdsBelongToAlbum(albumId, imageIds)
  if (!ownership.ok) return adminAuthJsonResponse(ownership)

  const { error, updatedCount } = await adminMarkImagesReady(albumId, imageIds)
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    updatedCount,
  })
}
