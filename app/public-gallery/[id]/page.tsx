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
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import { SiteGateScreen } from '@/components/site-gate/SiteGateScreen'
import {
  applyOwnerPreviewBypass,
  resolvePublicSiteGateByUserId,
} from '@/lib/site-access/public-gate'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature, getGalleryPhotoLimit } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import { buildGalleryDetailViewModel } from '@/lib/public-site/adapters/build-gallery-detail-view-model'
import {
  toClassicGalleryDetailPageProps,
  toClassicSiteFooterProps,
  toClassicSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicGalleryDetailShell } from '@/components/photographer/react-site/ClassicGalleryDetailShell'
import {
  toDarkGalleryDetailPageProps,
  toDarkSiteFooterProps,
  toDarkSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/dark'
import { DarkGalleryDetailShell } from '@/components/photographer/react-site/DarkGalleryDetailShell'
import {
  toElegantGalleryDetailPageProps,
  toElegantSiteFooterProps,
  toElegantSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantGalleryDetailShell } from '@/components/photographer/react-site/ElegantGalleryDetailShell'
import {
  toModernGalleryDetailPageProps,
  toModernSiteFooterProps,
  toModernSiteHeaderProps,
} from '@/lib/public-site/adapters/theme-props/modern'
import { ModernGalleryDetailShell } from '@/components/photographer/react-site/ModernGalleryDetailShell'

type PublicGalleryPageProps = {
  params: Promise<{ id: string }>
}

type UserData = {
  studio_name: string | null
  slug: string | null
  logo_url: string | null
  accent_color: string | null
  heading_font: string | null
  about_title_font: string | null
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
  displayed_gallery_id: string | null
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

  const siteGate = await applyOwnerPreviewBypass(
    await resolvePublicSiteGateByUserId(galleryData.user_id)
  )
  if (siteGate) {
    return (
      <SiteGateScreen
        mode={siteGate.mode}
        studioName={siteGate.studioName}
        siteLanguage={siteGate.siteLanguage}
      />
    )
  }

  // Fetch user data and entitlements
  const { data: user, error: userError } = await admin
    .from('users')
    .select(
      'studio_name, slug, logo_url, accent_color, heading_font, about_title_font, selected_theme, should_color_logo, gallery_layout_mode, contact_card_title, contact_card_description, phone, email, address, faq_items, site_language, displayed_gallery_id'
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

  // Fetch entitlements for public gating
  const entitlements = await getStudioEntitlements(galleryData.user_id)
  const isFree = !entitlements.isPro

  // For FREE users: only allow access to the displayed gallery
  if (isFree) {
    const displayedGalleryId = user?.displayed_gallery_id ?? null
    if (displayedGalleryId && displayedGalleryId !== galleryData.id) {
      // This gallery is not the displayed one for this FREE user
      notFound()
    }
    // If no displayed_gallery_id is set, allow access (fallback to first public gallery)
  }

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

  const photos = await fetchPublicGalleryDisplayPhotos(admin, galleryData.id, {
    limit: isFree ? getGalleryPhotoLimit(entitlements) : undefined,
    random: isFree,
  })
  console.log('[public-gallery/page] render', {
    galleryId: galleryData.id,
    photoCount: photos.length,
    userFound: Boolean(userData),
  })

  const siteLanguage = resolveSiteLanguage(userData?.site_language)
  const galleryDate = formatSiteDate(galleryData.created_at, siteLanguage)

  if (userData?.slug && (await isReactPublicSiteEnabled())) {
    const viewModel = buildGalleryDetailViewModel({
      photographer: {
        studio_name: userData.studio_name,
        logo_url: logoUrl,
        should_color_logo: userData.should_color_logo,
        accent_color: userData.accent_color,
        heading_font: userData.heading_font,
        about_title_font: userData.about_title_font,
        site_language: userData.site_language,
        gallery_layout_mode: userData.gallery_layout_mode,
        contact_card_title: userData.contact_card_title,
        contact_card_description: userData.contact_card_description,
      },
      gallery: {
        title: galleryData.title,
        photoCount: photos.length,
        galleryDate,
        photos,
      },
      homepagePath,
      blogPath,
      portfolioPath,
      beforeAfterPath: `${canonicalPath}/before-after`,
      hasFaq,
      hasPackages,
      hasBlog,
      hasPhotoEditComparisons,
    })

    if (userData.selected_theme === 'dark' || userData.selected_theme === 'bold') {
      return (
        <DarkGalleryDetailShell
          headerProps={toDarkSiteHeaderProps(viewModel)}
          footerProps={toDarkSiteFooterProps(viewModel)}
          pageProps={toDarkGalleryDetailPageProps(viewModel)}
        />
      )
    }

    if (userData.selected_theme === 'elegant') {
      return (
        <ElegantGalleryDetailShell
          headerProps={toElegantSiteHeaderProps(viewModel)}
          footerProps={toElegantSiteFooterProps(viewModel)}
          pageProps={toElegantGalleryDetailPageProps(viewModel)}
        />
      )
    }

    if (userData.selected_theme === 'modern') {
      return (
        <ModernGalleryDetailShell
          headerProps={toModernSiteHeaderProps(viewModel)}
          footerProps={toModernSiteFooterProps(viewModel)}
          pageProps={toModernGalleryDetailPageProps(viewModel)}
        />
      )
    }

    return (
      <ClassicGalleryDetailShell
        headerProps={toClassicSiteHeaderProps(viewModel)}
        footerProps={toClassicSiteFooterProps(viewModel)}
        pageProps={toClassicGalleryDetailPageProps(viewModel)}
      />
    )
  }

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
    .select('studio_name, logo_url')
    .eq('id', gallery.user_id)
    .maybeSingle()

  const typedUser = user as { studio_name: string | null; logo_url: string | null } | null
  const studioName = typedUser?.studio_name || 'Studio Gallery'
  const title = `${gallery.title} | ${studioName}`
  const description = `גלריה ציבורית מאת ${studioName}`
  const canonicalPath = `/public-gallery/${gallery.id}`
  const shareImage = await resolveGalleryShareImage(
    gallery.id,
    (coverRow as { cover_image: string | null } | null)?.cover_image ?? null
  )
  const logoIconUrl =
    getBrandingFaviconPublicUrl(gallery.user_id, typedUser?.logo_url ?? null) ??
    getBrandingPublicMediaUrl(typedUser?.logo_url ?? null)

  return {
    title,
    description,
    ...(logoIconUrl
      ? {
          icons: {
            icon: logoIconUrl,
            shortcut: logoIconUrl,
            apple: logoIconUrl,
          },
        }
      : {}),
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
