import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicGalleryPageHTML } from '@/lib/public-gallery-html'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'

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
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, title, created_at, user_id, is_public')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!gallery) notFound()

  const galleryData = gallery as GalleryData
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('users')
    .select(
      'studio_name, slug, logo_url, accent_color, selected_theme, contact_card_title, contact_card_description'
    )
    .eq('id', galleryData.user_id)
    .single()

  const userData = user as UserData | null
  const accentColor = userData?.accent_color ?? '#7c3aed'
  const siteTheme = normalizeSiteTheme(userData?.selected_theme)
  const studioName = userData?.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(userData?.slug, userData?.studio_name)
  const logoUrl = userData?.logo_url ? await resolveMediaUrl('branding', userData.logo_url) : null

  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryData.id)

  let photosToDisplay: { id: string; preview_url: string | null }[] = []
  let bucket: 'previews' | 'edited' = 'previews'

  if (editedPhotos && editedPhotos.length > 0) {
    photosToDisplay = editedPhotos.map((ep) => ({
      id: ep.photo_id,
      preview_url: ep.final_url,
    }))
    bucket = 'edited'
  } else {
    const { data: regularPhotos } = await admin
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', galleryData.id)
      .eq('is_visible_to_client', true)
      .order('sort_order')

    photosToDisplay = (regularPhotos ?? []) as { id: string; preview_url: string | null }[]
  }

  const previewPaths = photosToDisplay.map((photo) => photo.preview_url)
  const signedUrls = await signStoragePaths(bucket, previewPaths, galleryData.id)

  const photos = photosToDisplay.map((photo) => ({
    id: photo.id,
    url: photo.preview_url ? signedUrls[photo.preview_url] ?? null : null,
  }))

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
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('title, user_id')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  const gallery = data as { title: string; user_id: string } | null
  if (!gallery) {
    return { title: 'גלריה לא נמצאה' }
  }

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .single()

  const studioName = (user as { studio_name: string | null } | null)?.studio_name || 'Studio Gallery'

  return {
    title: `${gallery.title} | ${studioName}`,
    description: `גלריה ציבורית מאת ${studioName}`,
  }
}
