import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminInsertImage } from '@/lib/admin-db'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

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
  const imageUrl = String(record.image_url ?? '').trim()
  const thumbnailUrl = String(record.thumbnail_url ?? '').trim()

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }
  if (!imageUrl || !thumbnailUrl) {
    return NextResponse.json(
      { ok: false, message: 'חסרים image_url או thumbnail_url' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { error } = await adminInsertImage(albumId, imageUrl, thumbnailUrl)
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

  return NextResponse.json({ ok: true, message: 'תמונה נרשמה בגלריה' })
}
