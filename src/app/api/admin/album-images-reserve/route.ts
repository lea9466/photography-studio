import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminReserveImagesBatch } from '@/lib/admin-db'
import { galleryOriginalExtensionFromFileName } from '@/lib/r2'
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
  const rawFiles = record.files

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'חסר מערך files' },
      { status: 400 }
    )
  }

  if (rawFiles.length > BATCH_MAX) {
    return NextResponse.json(
      { ok: false, message: `מקסימום ${BATCH_MAX} תמונות בבקשה` },
      { status: 400 }
    )
  }

  const items: { originalExt: string }[] = []
  for (const entry of rawFiles) {
    const row = entry as Record<string, unknown>
    const fileName = String(row.fileName ?? '').trim()
    if (!fileName) {
      return NextResponse.json(
        { ok: false, message: 'כל פריט חייב fileName' },
        { status: 400 }
      )
    }
    items.push({
      originalExt: galleryOriginalExtensionFromFileName(fileName),
    })
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { error, reserved } = await adminReserveImagesBatch(albumId, items)
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
    message: `${reserved.length} תמונות שמורות לפני העלאה`,
    reserved,
  })
}
