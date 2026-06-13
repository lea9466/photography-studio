import 'server-only'

import {
  resolveGalleryMediaUrls,
  type GalleryImageRef,
} from '@/lib/gallery-media-urls'
import { fileNameFromMediaUrl } from '@/lib/storage-urls'
import { createZipStream, uniqueNames, type ZipEntry } from '@/lib/zip'

export type GalleryZipQuality = 'original' | 'compressed'

async function* galleryZipEntries(
  albumId: string,
  images: GalleryImageRef[],
  photographerId?: string | null,
  quality: GalleryZipQuality = 'original'
): AsyncGenerator<ZipEntry> {
  const downloadUrls = images.map((img) => {
    const urls = resolveGalleryMediaUrls(albumId, img, photographerId)
    return quality === 'compressed' ? urls.thumb : urls.download
  })
  const names = uniqueNames(
    downloadUrls.map((url, i) => fileNameFromMediaUrl(url, i))
  )

  for (let i = 0; i < images.length; i++) {
    const url = downloadUrls[i]
    if (!url) continue

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'image/*,*/*' },
    })
    if (!res.ok) {
      throw new Error(`שגיאה בהורדת תמונה ${i + 1}`)
    }

    yield { name: names[i], data: new Uint8Array(await res.arrayBuffer()) }
  }
}

export function createGalleryZipStream(
  albumId: string,
  images: GalleryImageRef[],
  photographerId?: string | null,
  quality: GalleryZipQuality = 'original'
): ReadableStream<Uint8Array> {
  return createZipStream(
    galleryZipEntries(albumId, images, photographerId, quality)
  )
}
