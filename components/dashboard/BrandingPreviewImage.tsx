'use client'

import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'

type BrandingPreviewImageProps = {
  src: string | null | undefined
  alt: string
  className?: string
}

export function BrandingPreviewImage({ src, alt, className = '' }: BrandingPreviewImageProps) {
  const previewSrc = getBrandingPreviewUrl(src)
  if (!previewSrc) return null

  return (
    <img
      src={previewSrc}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      loading="lazy"
      decoding="async"
    />
  )
}
