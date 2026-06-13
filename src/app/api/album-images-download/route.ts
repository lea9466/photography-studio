import { NextResponse } from 'next/server'
import {
  fetchAlbumByToken,
  fetchAlbumForClient,
  isAlbumExpired,
  logDownloads,
} from '@/lib/client-db'
import { getClientSession } from '@/lib/client-session'
import {
  createGalleryZipStream,
  type GalleryZipQuality,
} from '@/lib/gallery-download'
import type { GalleryImageRef } from '@/lib/gallery-media-urls'
import { MAX_CLIENT_BULK_DOWNLOAD } from '@/lib/album-download-urls'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function asciiFallback(name: string): string {
  return name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'gallery'
}

function parseQuality(raw: string | null): GalleryZipQuality {
  return raw === 'compressed' ? 'compressed' : 'original'
}

export async function GET(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json({ ok: false, message: 'לא מוגדר' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim() ?? ''
  const albumId = searchParams.get('album')?.trim() ?? ''
  const rawIds = searchParams.get('ids')?.trim() ?? ''
  const quality = parseQuality(searchParams.get('quality'))

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

  if (imageIds.length > MAX_CLIENT_BULK_DOWNLOAD) {
    return NextResponse.json(
      {
        ok: false,
        message: `ניתן להוריד עד ${MAX_CLIENT_BULK_DOWNLOAD} תמונות בבקשה אחת`,
      },
      { status: 400 }
    )
  }

  let resolvedAlbumId = albumId
  let clientId: string | null = null
  let photographerId: string | null = null
  let albumTitle = 'gallery'

  if (token) {
    const album = await fetchAlbumByToken(token)
    if (!album) {
      return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
    }
    if (isAlbumExpired(album)) {
      return NextResponse.json(
        { ok: false, message: 'תוקף הגלריה פג' },
        { status: 403 }
      )
    }
    resolvedAlbumId = album.id
    clientId = album.client_id
    photographerId = album.photographer_id
    albumTitle = album.title?.trim() || albumTitle
  } else if (albumId) {
    const sessionClientId = await getClientSession()
    if (!sessionClientId) {
      return NextResponse.json({ ok: false, message: 'יש להתחבר' }, { status: 401 })
    }
    const album = await fetchAlbumForClient(sessionClientId, albumId)
    if (!album) {
      return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
    }
    if (isAlbumExpired(album)) {
      return NextResponse.json(
        { ok: false, message: 'תוקף הגלריה פג' },
        { status: 403 }
      )
    }
    clientId = sessionClientId
    photographerId = album.photographer_id
    albumTitle = album.title?.trim() || albumTitle
  } else {
    return NextResponse.json(
      { ok: false, message: 'חסר album או token' },
      { status: 400 }
    )
  }

  const sb = getAdminClient()
  if (!sb) {
    return NextResponse.json({ ok: false, message: 'לא מוגדר' }, { status: 503 })
  }

  const { data, error } = await sb
    .from('images')
    .select('id, album_id, image_url, thumbnail_url, original_ext, status, created_at')
    .eq('album_id', resolvedAlbumId)
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

  if (clientId) {
    logDownloads(
      clientId,
      images.map((img) => img.id)
    ).catch(() => {})
  }

  const suffix = quality === 'compressed' ? '-compressed' : '-selection'
  const baseName = asciiFallback(`${albumTitle}${suffix}`)
  const utf8Name = encodeURIComponent(`${albumTitle}${suffix}.zip`)

  return new Response(
    createGalleryZipStream(resolvedAlbumId, images, photographerId, quality),
    {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${baseName}.zip"; filename*=UTF-8''${utf8Name}`,
        'Cache-Control': 'no-store',
      },
    }
  )
}
