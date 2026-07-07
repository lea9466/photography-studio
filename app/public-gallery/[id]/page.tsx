import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicGalleryPageHTML } from '@/lib/public-gallery-html'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'
import {
  buildCanonicalUrl,
  buildPublicOpenGraph,
  resolveGalleryShareImage,
} from '@/lib/seo/public-metadata'

type PublicGalleryPageProps = {
  params: Promise<{ id: string }>
}

type GalleryData = {
  id: string
  title: string
  created_at: string
  user_id: string
  is_public: boolean
}

type UserData = {
  studio_name: string | null
  slug: string | null
  logo_url: string | null
  accent_color: string | null
  selected_theme: string | null
  contact_card_title: string | null
  contact_card_description: string | null
  faq_items: unknown
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: gallery } = await admin
    .from('galleries')
    .select('id, title, created_at, user_id, is_public')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!gallery) notFound()

  const galleryData = gallery as GalleryData

  const [{ data: user }, { count: packageCount }] = await Promise.all([
    admin
      .from('users')
      .select(
        'studio_name, slug, logo_url, accent_color, selected_theme, contact_card_title, contact_card_description, faq_items'
      )
      .eq('id', galleryData.user_id)
      .single(),
    admin
      .from('photography_packages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', galleryData.user_id)
      .eq('is_active', true),
  ])

  const userData = user as UserData | null
  const hasFaq = sanitizeFaqItems(parseFaqItems(userData?.faq_items)).length > 0
  const hasPackages = (packageCount ?? 0) > 0
  const accentColor = userData?.accent_color ?? '#7c3aed'
  const siteTheme = normalizeSiteTheme(userData?.selected_theme)
  const studioName = userData?.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(userData?.slug, userData?.studio_name)
  const logoUrl = userData?.logo_url ? await resolveMediaUrl('branding', userData.logo_url) : null

  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryData.id)

  type PublicGalleryPhotoRow = {
    id: string
    preview_url?: string | null
    watermarked_preview_url?: string | null
  }

  let photosToDisplay: PublicGalleryPhotoRow[] = []
  let bucket: 'previews' | 'edited' | 'watermarked' = 'watermarked'

  if (!PUBLIC_ONLY_MVP && editedPhotos && editedPhotos.length > 0) {
    photosToDisplay = editedPhotos.map((ep) => ({
      id: ep.photo_id,
      preview_url: ep.final_url,
    }))
    bucket = 'edited'
  } else if (!PUBLIC_ONLY_MVP) {
    const { data: legacyPhotos } = await admin
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', galleryData.id)
      .eq('is_visible_to_client', true)
      .order('sort_order')

    photosToDisplay = (legacyPhotos ?? []) as { id: string; preview_url: string | null }[]
    bucket = 'previews'
  } else {
    const { data: watermarkedPhotos } = await admin
      .from('photos')
      .select('id, watermarked_preview_url')
      .eq('gallery_id', galleryData.id)
      .eq('is_visible_to_client', true)
      .order('sort_order')

    photosToDisplay = (watermarkedPhotos ?? []) as PublicGalleryPhotoRow[]
    bucket = 'watermarked'
  }

  const previewPaths = photosToDisplay.map((photo) =>
    PUBLIC_ONLY_MVP
      ? photo.watermarked_preview_url ?? null
      : photo.preview_url ?? null
  )
  const signedUrls = await signStoragePaths(bucket, previewPaths, galleryData.id)

  const photos = photosToDisplay.map((photo) => {
    const path = PUBLIC_ONLY_MVP
      ? photo.watermarked_preview_url ?? null
      : photo.preview_url ?? null
    return {
      id: photo.id,
      url: path ? signedUrls[path] ?? null : null,
    }
  })

  const galleryDate = new Date(galleryData.created_at).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = generatePublicGalleryPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    hasFaq,
    hasPackages,
    gallery: {
      title: galleryData.title,
      photoCount: photos.length,
      galleryDate,
      photos,
      accentColor,
      contactCardTitle: userData?.contact_card_title ?? null,
      contactCardDescription: userData?.contact_card_description ?? null,
    },
  })

  return <HtmlFramePage html={html} title={`${galleryData.title} | ${studioName}`} />
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('galleries')
    .select('title, user_id, cover_image')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  const gallery = data as { title: string; user_id: string; cover_image: string | null } | null
  if (!gallery) {
    return { title: 'גלריה לא נמצאה' }
  }

  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .single()

  const studioName = (user as { studio_name: string | null } | null)?.studio_name || 'Studio Gallery'
  const title = `${gallery.title} | ${studioName}`
  const description = `גלריה ציבורית מאת ${studioName}`
  const canonicalPath = `/public-gallery/${id}`
  const shareImage = await resolveGalleryShareImage(id, gallery.cover_image)

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalUrl(canonicalPath),
    },
    openGraph: buildPublicOpenGraph({
      title,
      description,
      canonicalPath,
      imageUrl: shareImage,
    }),
  }
}
