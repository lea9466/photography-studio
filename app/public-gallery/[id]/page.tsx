import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPublicGalleryDisplayPhotos } from '@/lib/queries/public-gallery-photos'
import {
  fetchGalleryForPublicPage,
  normalizeRouteParam,
} from '@/lib/queries/public-gallery-page'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicGalleryPageHTML } from '@/lib/public-gallery-html'
import { formatSiteDate, resolveSiteLanguage } from '@/lib/site-language'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
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
  should_color_logo: boolean | null
  gallery_layout_mode: string | null
  contact_card_title: string | null
  contact_card_description: string | null
  phone: string | null
  email: string | null
  address: string | null
  faq_items: unknown
  site_language: string | null
}

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { id: rawId } = await params
  const normalizedId = normalizeRouteParam(rawId)

  console.log('[public-gallery/page] incoming request', {
    rawId,
    normalizedId,
    pathname: `/public-gallery/${normalizedId}`,
  })

  let admin
  try {
    admin = createAdminClient()
  } catch (error) {
    console.error('[public-gallery/page] admin client unavailable', {
      normalizedId,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }

  const galleryData = await fetchGalleryForPublicPage(admin, rawId)
  if (!galleryData) {
    console.warn('[public-gallery/page] notFound()', { rawId, normalizedId })
    notFound()
  }

  const { data: user, error: userError } = await admin
    .from('users')
    .select(
      'studio_name, slug, logo_url, accent_color, selected_theme, should_color_logo, gallery_layout_mode, contact_card_title, contact_card_description, phone, email, address, faq_items, site_language'
    )
    .eq('id', galleryData.user_id)
    .maybeSingle()

  if (userError) {
    console.error('[public-gallery/page] user lookup failed', {
      galleryId: galleryData.id,
      userId: galleryData.user_id,
      error: userError.message,
    })
  }

  const [{ count: packageCount }, { count: postCount }, { count: photoEditCount }] =
    await Promise.all([
      admin
        .from('photography_packages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', galleryData.user_id)
        .eq('is_active', true),
      admin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', galleryData.user_id),
      admin
        .from('photo_edit_comparisons')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', galleryData.user_id)
        .eq('is_active', true),
    ])

  const userData = user as UserData | null
  const hasFaq = sanitizeFaqItems(parseFaqItems(userData?.faq_items)).length > 0
  const hasPackages = (packageCount ?? 0) > 0
  const hasBlog = (postCount ?? 0) > 0
  const hasPhotoEditComparisons = (photoEditCount ?? 0) > 0
  const accentColor = userData?.accent_color ?? '#7c3aed'
  const siteTheme = normalizeSiteTheme(userData?.selected_theme)
  const studioName = userData?.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(userData?.slug, userData?.studio_name)
  const canonicalPath = getPublicSitePath(userData?.slug, userData?.studio_name) ?? homepagePath
  const portfolioPath = `${canonicalPath}/portfolio`
  const blogPath = `${canonicalPath}/blog`
  const galleryLayoutMode =
    userData?.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated'
  const logoUrl = userData?.logo_url ? await resolveMediaUrl('branding', userData.logo_url) : null

  const photos = await fetchPublicGalleryDisplayPhotos(admin, galleryData.id)
  console.log('[public-gallery/page] render', {
    galleryId: galleryData.id,
    photoCount: photos.length,
    userFound: Boolean(userData),
  })

  const siteLanguage = resolveSiteLanguage(userData?.site_language)
  const galleryDate = formatSiteDate(galleryData.created_at, siteLanguage)

  const html = generatePublicGalleryPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    portfolioPath,
    blogPath,
    hasFaq,
    hasPackages,
    hasBlog,
    hasPhotoEditComparisons,
    beforeAfterPath: hasPhotoEditComparisons ? `${canonicalPath}/before-after` : undefined,
    shouldColorLogo: userData?.should_color_logo ?? false,
    galleryLayoutMode,
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
  const { id: rawId } = await params
  const admin = createAdminClient()

  const gallery = await fetchGalleryForPublicPage(admin, rawId)
  if (!gallery) {
    return { title: 'גלריה לא נמצאה' }
  }

  const { data: coverRow } = await admin
    .from('galleries')
    .select('cover_image')
    .eq('id', gallery.id)
    .maybeSingle()

  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .maybeSingle()

  const studioName = (user as { studio_name: string | null } | null)?.studio_name || 'Studio Gallery'
  const title = `${gallery.title} | ${studioName}`
  const description = `גלריה ציבורית מאת ${studioName}`
  const canonicalPath = `/public-gallery/${gallery.id}`
  const shareImage = await resolveGalleryShareImage(
    gallery.id,
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
