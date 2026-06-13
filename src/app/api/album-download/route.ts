import { NextResponse } from 'next/server'
import {
  fetchAlbumByToken,
  fetchAlbumForClient,
  fetchAllAlbumImages,
  isAlbumExpired,
  logDownloads,
  type AlbumWithImages,
} from '@/lib/client-db'
import { getClientSession } from '@/lib/client-session'
import { createGalleryZipStream } from '@/lib/gallery-download'
import { getAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function asciiFallback(name: string): string {
  return name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'gallery'
}

export async function GET(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json({ ok: false, message: 'לא מוגדר' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const albumId = searchParams.get('album')

  let album: AlbumWithImages | null = null

  if (token) {
    album = await fetchAlbumByToken(token)
  } else if (albumId) {
    const clientId = await getClientSession()
    if (!clientId) {
      return NextResponse.json({ ok: false, message: 'יש להתחבר' }, { status: 401 })
    }
    album = await fetchAlbumForClient(clientId, albumId)
  }

  if (!album) {
    return NextResponse.json({ ok: false, message: 'לא נמצא' }, { status: 404 })
  }
  if (isAlbumExpired(album)) {
    return NextResponse.json({ ok: false, message: 'תוקף הגלריה פג' }, { status: 403 })
  }

  album = { ...album, images: await fetchAllAlbumImages(album.id) }

  if (album.images.length === 0) {
    return NextResponse.json({ ok: false, message: 'אין תמונות' }, { status: 404 })
  }

  logDownloads(
    album.client_id,
    album.images.map((i) => i.id)
  ).catch(() => {})

  const baseName = asciiFallback(album.title?.trim() || 'gallery')
  const utf8Name = encodeURIComponent(`${album.title?.trim() || 'gallery'}.zip`)

  return new Response(
    createGalleryZipStream(album.id, album.images, album.photographer_id),
    {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${baseName}.zip"; filename*=UTF-8''${utf8Name}`,
        'Cache-Control': 'no-store',
      },
    }
  )
}
