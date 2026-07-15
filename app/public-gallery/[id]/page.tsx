import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPublicGalleryDisplayPhotos } from '@/lib/queries/public-gallery-photos'
import { fetchGalleryForPublicPage } from '@/lib/queries/public-gallery-page'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicGalleryPageHTML } from '@/lib/public-gallery-html'
import { formatSiteDate, resolveSiteLanguage } from '@/lib/site-language'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { resolveMediaUrl } from '@/lib/r2/storage'
import {
  buildCanonicalUrl,
  buildPublicOpenGraph,
  resolveGalleryShareImage,
} from '@/lib/seo/public-metadata'

type PublicGalleryPageProps = {
  params: Promise<{ id: string }>
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
  site_language: string | null
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const galleryData = await fetchGalleryForPublicPage(admin, id)
  if (!galleryData) notFound()

  const [{ data: user }, { count: packageCount }] = await Promise.all([
    admin
      .from('users')
      .select(
        'studio_name, slug, logo_url, accent_color, selected_theme, contact_card_title, contact_card_description, faq_items, site_language'
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

  const photos = await fetchPublicGalleryDisplayPhotos(admin, galleryData.id)
  const siteLanguage = resolveSiteLanguage(userData?.site_language)
  const galleryDate = formatSiteDate(galleryData.created_at, siteLanguage)

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
    siteLanguage: userData?.site_language ?? 'he',
  })

  return <HtmlFramePage html={html} title={`${galleryData.title} | ${studioName}`} />
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const gallery = await fetchGalleryForPublicPage(admin, id)
  if (!gallery) {
    return { title: 'גלריה לא נמצאה' }
  }

  const { data: coverRow } = await admin
    .from('galleries')
    .select('cover_image')
    .eq('id', id)
    .maybeSingle()

  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .single()

  const studioName = (user as { studio_name: string | null } | null)?.studio_name || 'Studio Gallery'
  const title = `${gallery.title} | ${studioName}`
  const description = `גלריה ציבורית מאת ${studioName}`
  const canonicalPath = `/public-gallery/${id}`
  const shareImage = await resolveGalleryShareImage(
    id,
    (coverRow as { cover_image: string | null } | null)?.cover_image ?? null
  )

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
