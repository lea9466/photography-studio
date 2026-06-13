import { notFound } from 'next/navigation'
import AlbumViewer from '@/components/client/AlbumViewer'
import {
  fetchAlbumViewByToken,
  fetchSelectionMapForAlbum,
  isAlbumExpired,
} from '@/lib/client-db'
import { resolveAlbumViewerImages } from '@/lib/gallery-media-urls'

export const dynamic = 'force-dynamic'

export default async function SecretAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const album = await fetchAlbumViewByToken(token)
  if (!album) notFound()

  const selections = await fetchSelectionMapForAlbum(album.client_id, album.id)

  return (
    <main
      data-client="true"
      className="client-area-page px-[5vw] py-12 text-right md:py-16"
    >
      <div className="client-album-shell">
        <h1 className="font-display mb-2 text-3xl text-foreground md:text-4xl">
          {album.title?.trim() || 'גלריה'}
        </h1>
        <p className="client-muted-text mb-10 text-sm">
          גלריה פרטית · בחרו תמונות לאלבום או לעיבוד, או הורידו את הכל
        </p>

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
          downloadHref={`/api/album-download?token=${encodeURIComponent(token)}`}
          token={token}
          expired={isAlbumExpired(album)}
          maxAlbum={album.max_album_selections}
          maxEdit={album.max_edit_selections}
        />
      </div>
    </main>
  )
}
