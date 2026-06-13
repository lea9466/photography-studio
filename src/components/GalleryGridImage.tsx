'use client'

import { useState } from 'react'
import { pickGridMediaUrl } from '@/lib/media-urls'

type Props = {
  thumbnailUrl: string | null | undefined
  imageUrl: string | null | undefined
  index: number
  className?: string
}

/** תמונת גריד מהירה — מיניאטורה, lazy, כמו GalleryLightbox */
export default function GalleryGridImage({
  thumbnailUrl,
  imageUrl,
  index,
  className = 'h-full w-full object-cover',
}: Props) {
  const preferred = pickGridMediaUrl(thumbnailUrl, imageUrl)
  const fallback = (imageUrl || thumbnailUrl)?.trim() || ''
  const [src, setSrc] = useState(preferred)

  if (!preferred) return null

  const eager = index < 6

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={index < 4 ? 'high' : 'low'}
      className={className}
      onError={() => {
        if (fallback && src !== fallback) setSrc(fallback)
      }}
    />
  )
}
