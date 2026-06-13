import { NextResponse } from 'next/server'
import {
  ALBUM_IMAGES_PAGE_SIZE,
  decodeAlbumImageCursor,
  encodeAlbumImageCursor,
  fetchAlbumByToken,
  fetchAlbumForClient,
  fetchAlbumImagesPaginated,
  fetchAlbumReadyImageCount,
  isAlbumExpired,
} from '@/lib/client-db'
import { resolveAlbumViewerImages } from '@/lib/gallery-media-urls'
import { getClientSession } from '@/lib/client-session'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parsePageSize(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return ALBUM_IMAGES_PAGE_SIZE
  return Math.min(Math.floor(n), 100)
}

export async function GET(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json({ ok: false, message: 'לא מוגדר' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const albumId = searchParams.get('album')
  const cursorRaw = searchParams.get('cursor')
  const pageSize = parsePageSize(searchParams.get('limit'))

  let resolvedAlbumId: string | null = null
  let photographerId: string | null = null

  if (token) {
    const album = await fetchAlbumByToken(token)
    if (!album) {
      return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
    }
    if (isAlbumExpired(album)) {
      return NextResponse.json({ ok: false, message: 'תוקף הגלריה פג' }, { status: 403 })
    }
    if (albumId && album.id !== albumId) {
      return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
    }
    resolvedAlbumId = album.id
    photographerId = album.photographer_id
  } else if (albumId) {
    const clientId = await getClientSession()
    if (!clientId) {
      return NextResponse.json({ ok: false, message: 'יש להתחבר' }, { status: 401 })
    }
    const album = await fetchAlbumForClient(clientId, albumId)
    if (!album) {
      return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
    }
    if (isAlbumExpired(album)) {
      return NextResponse.json({ ok: false, message: 'תוקף הגלריה פג' }, { status: 403 })
    }
    resolvedAlbumId = album.id
    photographerId = album.photographer_id
  } else {
    return NextResponse.json({ ok: false, message: 'חסר album או token' }, { status: 400 })
  }

  const cursor = decodeAlbumImageCursor(cursorRaw)
  if (cursorRaw && !cursor) {
    return NextResponse.json({ ok: false, message: 'cursor לא תקין' }, { status: 400 })
  }

  const [page, totalCount] = await Promise.all([
    fetchAlbumImagesPaginated(resolvedAlbumId, cursor, pageSize),
    fetchAlbumReadyImageCount(resolvedAlbumId),
  ])

  if (page.error) {
    return NextResponse.json({ ok: false, message: page.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    images: resolveAlbumViewerImages(
      resolvedAlbumId,
      page.images,
      photographerId
    ),
    nextCursor: page.nextCursor ? encodeAlbumImageCursor(page.nextCursor) : null,
    totalCount,
  })
}
