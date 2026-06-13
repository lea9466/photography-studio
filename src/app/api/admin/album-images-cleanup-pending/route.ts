import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { adminCleanupPendingImagesForAlbum } from '@/lib/admin-db'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

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

  const albumId = String((body as Record<string, unknown>).album_id ?? '').trim()
  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const { error, deletedCount } = await adminCleanupPendingImagesForAlbum(albumId)
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  revalidatePath('/admin')

  return NextResponse.json({
    ok: true,
    message:
      deletedCount === 0
        ? 'אין שורות תלויות לניקוי'
        : `${deletedCount.toLocaleString('he-IL')} שורות תלויות נוקו`,
    deletedCount,
  })
}
