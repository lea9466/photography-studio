import { fetchPublicAlbums } from '@/lib/db'

export type FeaturedImage = {
  id: string
  src: string
  alt: string
}

export async function getFeaturedPhotos(
  limit = 6,
  photographerId?: string
): Promise<FeaturedImage[]> {
  const albums = await fetchPublicAlbums(limit, photographerId)

  return albums
    .map((row) => {
      const src = row.cover_image?.trim()
      if (!src) return null
      return {
        id: row.id,
        src,
        alt: row.title?.trim() || 'עבודה נבחרת',
      }
    })
    .filter((item): item is FeaturedImage => item !== null)
}
