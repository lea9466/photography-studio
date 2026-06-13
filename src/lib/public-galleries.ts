import {
  fetchPublicAlbumsWithImageCount,
  type PublicAlbumCardPreview,
} from '@/lib/db'
import { mediaCoverCardUrl } from '@/lib/media-urls'

export type GalleryCard = {
  id: string
  title: string
  cover: string
  count: number
}

export function albumsToGalleryCards(albums: PublicAlbumCardPreview[]): GalleryCard[] {
  return albums
    .map((album) => {
      const coverRaw = album.cover_image?.trim()
      if (!coverRaw) return null

      return {
        id: album.id,
        title: album.title?.trim() || 'גלריה',
        cover: mediaCoverCardUrl(coverRaw),
        count: album.image_count,
      }
    })
    .filter((item): item is GalleryCard => item !== null)
}

export async function fetchPublicGalleryCards(
  limit = 12,
  photographerId?: string
): Promise<GalleryCard[]> {
  const albums = await fetchPublicAlbumsWithImageCount(limit, photographerId)
  return albumsToGalleryCards(albums)
}
