import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerAlbumAccess,
  verifyImageIdsBelongToAlbum,
} from '@/lib/api-auth-helpers'
import { createGalleryZipStream } from '@/lib/gallery-download'
import type { GalleryImageRef } from '@/lib/gallery-media-urls'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_DOWNLOAD = 200

function asciiFallback(name: string): string {
  return name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'gallery'
}

export async function GET(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const albumId = searchParams.get('album_id')?.trim() ?? ''
  const rawIds = searchParams.get('ids')?.trim() ?? ''

  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: 'חסר album_id' },
      { status: 400 }
    )
  }

  const imageIds = [
    ...new Set(
      rawIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ]

  if (imageIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'לא נבחרו תמונות להורדה' },
      { status: 400 }
    )
  }

  if (imageIds.length > MAX_DOWNLOAD) {
    return NextResponse.json(
      {
        ok: false,
        message: `ניתן להוריד עד ${MAX_DOWNLOAD} תמונות בבקשה אחת`,
      },
      { status: 400 }
    )
  }

  const auth = await requirePhotographerAlbumAccess(albumId)
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const ownership = await verifyImageIdsBelongToAlbum(albumId, imageIds)
  if (!ownership.ok) return adminAuthJsonResponse(ownership)

  const sb = getAdminClient()
  if (!sb) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  const { data, error } = await sb
    .from('images')
    .select('id, album_id, image_url, thumbnail_url, original_ext, status, created_at')
    .eq('album_id', albumId)
    .in('id', imageIds)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  const images = (data ?? []) as GalleryImageRef[]
  if (images.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'אין תמונות מוכנות להורדה בבחירה' },
      { status: 404 }
    )
  }

  const { data: album } = await sb
    .from('albums')
    .select('title')
    .eq('id', albumId)
    .maybeSingle()

  const baseName = asciiFallback(album?.title?.trim() || 'gallery-selection')
  const utf8Name = encodeURIComponent(`${album?.title?.trim() || 'gallery'}-selection.zip`)

  return new Response(
    createGalleryZipStream(albumId, images, auth.photographerId),
    {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${baseName}.zip"; filename*=UTF-8''${utf8Name}`,
        'Cache-Control': 'no-store',
      },
    }
  )
}
