import Link from 'next/link'
import { redirect } from 'next/navigation'
import AlbumViewer from '@/components/client/AlbumViewer'
import {
  fetchClientAlbumView,
  fetchSelectionMapForAlbum,
  isAlbumExpired,
} from '@/lib/client-db'
import { resolveAlbumViewerImages } from '@/lib/gallery-media-urls'
import { getClientSession } from '@/lib/client-session'
import { tenantPath } from '@/lib/tenant-paths'

export const dynamic = 'force-dynamic'

export default async function ClientAlbumPage({
  params,
}: {
  params: Promise<{ photographer_slug: string; id: string }>
}) {
  const { photographer_slug, id } = await params
  const clientBase = tenantPath(photographer_slug, '/client')
  const clientId = await getClientSession()
  if (!clientId) redirect(clientBase)

  const album = await fetchClientAlbumView(clientId, id)
  if (!album) {
    return (
      <main className="client-area-page px-[5vw] py-24 text-right">
        <div className="client-album-shell">
          <p className="client-muted-text">הגלריה לא נמצאה.</p>
          <Link
            href={clientBase}
            className="theme-label mt-6 inline-block text-sm transition-opacity hover:opacity-70"
          >
            ← חזרה לגלריות
          </Link>
        </div>
      </main>
    )
  }

  const selections = await fetchSelectionMapForAlbum(clientId, album.id)

  return (
    <main className="client-area-page px-[5vw] py-12 text-right md:py-16">
      <div className="client-album-shell">
        <Link
          href={clientBase}
          className="theme-label text-sm transition-opacity hover:opacity-70"
        >
          ← חזרה לגלריות
        </Link>
        <h1 className="font-display mt-4 mb-10 text-3xl text-foreground md:text-4xl">
          {album.title?.trim() || 'גלריה'}
        </h1>

        <AlbumViewer
          albumId={album.id}
          photographerId={album.photographer_id}
          images={resolveAlbumViewerImages(
            album.id,
            album.images,
            album.photographer_id
          )}
          initialNextCursor={album.nextCursor}
          totalCount={album.totalCount}
          initialSelections={selections}
          downloadHref={`/api/album-download?album=${album.id}`}
          expired={isAlbumExpired(album)}
          maxAlbum={album.max_album_selections}
          maxEdit={album.max_edit_selections}
        />
      </div>
    </main>
  )
}
