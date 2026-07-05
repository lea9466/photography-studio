'use client'

import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'

type BrandingPreviewImageProps = {
  src: string | null | undefined
  alt: string
  className?: string
  cacheKey?: string | number
}

export function BrandingPreviewImage({
  src,
  alt,
  className = '',
  cacheKey,
}: BrandingPreviewImageProps) {
  const previewSrc = getBrandingPreviewUrl(src)
  if (!previewSrc) return null

  const versionedSrc =
    previewSrc.startsWith('blob:') || cacheKey === undefined
      ? previewSrc
      : `${previewSrc}${previewSrc.includes('?') ? '&' : '?'}v=${cacheKey}`

  return (
    <img
      src={versionedSrc}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      loading="eager"
      decoding="async"
    />
  )
}
