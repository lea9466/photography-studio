import { NextResponse } from 'next/server'
import { adminFetchPendingImagesByAlbumId } from '@/lib/admin-db'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
} from '@/lib/api-auth-helpers'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  const albumId = new URL(request.url).searchParams.get('album_id')?.trim() ?? ''
  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const pending = await adminFetchPendingImagesByAlbumId(albumId)

  return NextResponse.json({
    ok: true,
    pending: pending.map((row) => ({
      id: row.id,
      original_ext: row.original_ext,
      created_at: row.created_at,
    })),
    count: pending.length,
  })
}
