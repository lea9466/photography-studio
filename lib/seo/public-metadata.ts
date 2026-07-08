import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'

export function getAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://studio-galleries.com').replace(/\/$/, '')
}

export function buildCanonicalUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getAppBaseUrl()}${normalizedPath}`
}

export function toAbsoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${getAppBaseUrl()}${url}`
  return url
}

export function buildOpenGraphImages(
  imageUrl: string | null | undefined
): NonNullable<Metadata['openGraph']>['images'] {
  const absolute = toAbsoluteMediaUrl(imageUrl)
  if (!absolute) return undefined
  return [{ url: absolute }]
}

type PhotographerShareImageSource = {
  about_image_url?: string | null
  hero_desktop_url?: string | null
  hero_mobile_url?: string | null
  hero_desktop_urls?: string[] | null
  hero_mobile_urls?: string[] | null
  logo_url?: string | null
}

export async function resolvePhotographerShareImage(
  photographer: PhotographerShareImageSource
): Promise<string | null> {
  const aboutImage = await resolveBrandingPath(photographer.about_image_url ?? null)
  if (aboutImage) return aboutImage

  const heroDesktop = await resolveBrandingPath(photographer.hero_desktop_url ?? null)
  if (heroDesktop) return heroDesktop

  const heroMobile = await resolveBrandingPath(photographer.hero_mobile_url ?? null)
  if (heroMobile) return heroMobile

  for (const path of photographer.hero_desktop_urls ?? []) {
    const url = await resolveBrandingPath(path)
    if (url) return url
  }

  for (const path of photographer.hero_mobile_urls ?? []) {
    const url = await resolveBrandingPath(path)
    if (url) return url
  }

  return resolveBrandingPath(photographer.logo_url ?? null)
}

export async function resolveGalleryCoverImagePath(
  coverImage: string | null | undefined,
  galleryId?: string
): Promise<string | null> {
  if (!coverImage) return null

  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage
  }

  if (coverImage.startsWith('cover-images/')) {
    const proxyPath = `/api/gallery-media?key=${encodeURIComponent(coverImage)}`
    return galleryId
      ? `${proxyPath}&galleryId=${encodeURIComponent(galleryId)}`
      : proxyPath
  }

  return resolveMediaUrl('branding', coverImage, galleryId)
}

export async function resolveGalleryCoverCardPath(
  coverImage: string | null | undefined,
  galleryId?: string
): Promise<string | null> {
  return resolveGalleryCoverImagePath(coverImage, galleryId)
}

export async function resolveGalleryShareImage(
  galleryId: string,
  coverImage: string | null | undefined
): Promise<string | null> {
  const cover = await resolveGalleryCoverImagePath(coverImage, galleryId)
  if (cover) return cover

  const admin = createAdminClient()

  if (!PUBLIC_ONLY_MVP) {
    const { data: editedPhoto } = await admin
      .from('edited_photos')
      .select('final_url')
      .eq('gallery_id', galleryId)
      .limit(1)
      .maybeSingle()

    if (editedPhoto?.final_url) {
      const signed = await signStoragePaths('edited', [editedPhoto.final_url], galleryId)
      return signed[editedPhoto.final_url] ?? null
    }

    const { data: firstPhoto } = await admin
      .from('photos')
      .select('preview_url')
      .eq('gallery_id', galleryId)
      .eq('is_visible_to_client', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (firstPhoto?.preview_url) {
      const signed = await signStoragePaths('previews', [firstPhoto.preview_url], galleryId)
      return signed[firstPhoto.preview_url] ?? null
    }

    return null
  }

  const { data: firstPhoto } = await admin
    .from('photos')
    .select('watermarked_preview_url')
    .eq('gallery_id', galleryId)
    .eq('is_visible_to_client', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstPhoto?.watermarked_preview_url) {
    const signed = await signStoragePaths(
      'watermarked',
      [firstPhoto.watermarked_preview_url],
      galleryId
    )
    return signed[firstPhoto.watermarked_preview_url] ?? null
  }

  return null
}

export function buildPublicOpenGraph({
  title,
  description,
  canonicalPath,
  imageUrl,
}: {
  title: string
  description: string
  canonicalPath: string
  imageUrl?: string | null
}): Metadata['openGraph'] {
  const url = buildCanonicalUrl(canonicalPath)
  const images = buildOpenGraphImages(imageUrl)

  return {
    title,
    description,
    type: 'website',
    url,
    ...(images ? { images } : {}),
  }
}
