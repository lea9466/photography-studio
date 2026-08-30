import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { getCanonicalBaseUrl, getGoogleSiteVerificationToken } from '@/lib/domains/custom-domain-lookup'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import { fetchPublicGalleryDisplayPhotos } from '@/lib/queries/public-gallery-photos'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import {
  generatePublicPortfolioPageHTML,
  type PortfolioPhoto,
} from '@/lib/public-portfolio-html'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { resolvePortfolioGalleriesSectionTitle } from '@/lib/galleries-section-copy'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature, getGalleryPhotoLimit } from '@/lib/subscriptions/entitlements'
import { pickFreeDisplayedGallery } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import { buildPortfolioViewModel } from '@/lib/public-site/adapters/build-portfolio-view-model'
import { toClassicPortfolioPageProps } from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicPortfolioShell } from '@/components/photographer/react-site/ClassicPortfolioShell'
import { toDarkPortfolioPageProps } from '@/lib/public-site/adapters/theme-props/dark'
import { DarkPortfolioShell } from '@/components/photographer/react-site/DarkPortfolioShell'
import { toElegantPortfolioPageProps } from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantPortfolioShell } from '@/components/photographer/react-site/ElegantPortfolioShell'
import { toModernPortfolioPageProps } from '@/lib/public-site/adapters/theme-props/modern'
import { ModernPortfolioShell } from '@/components/photographer/react-site/ModernPortfolioShell'

interface PortfolioPageProps {
  params: Promise<{ slug: string }>
}

function gallerySectionHash(theme: string | null | undefined): string {
  const normalized = theme ?? 'elegant'
  if (normalized === 'modern') return 'portfolio'
  if (normalized === 'classic') return 'galleries'
  return 'gallery'
}

export default async function PhotographerPortfolioPage({ params }: PortfolioPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  console.log('[photographer-portfolio] request', {
    slug: decodedSlug,
    photographerFound: Boolean(photographer),
    photographerId: photographer?.id ?? null,
  })

  if (!photographer) notFound()

  const typed = photographer as typeof photographer & {
    id: string
    gallery_layout_mode: string | null
    accent_color: string | null
    selected_theme: string | null
    should_color_logo: boolean
    faq_items: unknown
    galleries_title: string | null
    displayed_gallery_id: string | null
  }

  const layoutMode = typed.gallery_layout_mode ?? 'separated'
  const canonicalPath =
    getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`

  console.log('[photographer-portfolio] layout', {
    slug: decodedSlug,
    layoutMode,
    canonicalPath,
  })

  if (layoutMode !== 'portfolio') {
    const galleryHash = gallerySectionHash(typed.selected_theme)
    // On a photographer's connected custom domain, `canonicalPath`
    // (`/{slug}`) doesn't exist — the middleware only recognizes a small
    // fixed set of tenant-relative paths (see lib/domains/rewrite.ts) and
    // would 404 it. Redirect root-relative instead so it resolves against
    // whatever host the visitor is actually on.
    const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
    const redirectTarget = isTenantDomain ? `/#${galleryHash}` : `${canonicalPath}#${galleryHash}`
    console.log('[photographer-portfolio] separated mode redirect', {
      slug: decodedSlug,
      redirectTo: redirectTarget,
    })
    redirect(redirectTarget)
  }

  // Fetch entitlements for public gating
  const entitlements = await getStudioEntitlements(typed.id)
  const isFree = !entitlements.isPro

  // For FREE users: determine the single displayed gallery
  let displayedGalleryId: string | null = null
  if (isFree) {
    displayedGalleryId = typed.displayed_gallery_id ?? null
  }

  const admin = createAdminClient()

  let galleriesQuery = admin
    .from('galleries')
    .select('id, title, created_at, gallery_type, is_public')
    .eq('user_id', typed.id)
    .eq('gallery_type', 'portfolio')

  if (isFree) {
    // FREE: only show the selected displayed gallery — and only if it's
    // still public (it may have been switched to private after selection).
    if (displayedGalleryId) {
      galleriesQuery = galleriesQuery
        .eq('id', displayedGalleryId)
        .eq('is_public', true)
    } else {
      // Fallback: pick earliest public portfolio gallery deterministically
      const { data: allGalleries } = await admin
        .from('galleries')
        .select('id, is_public, created_at')
        .eq('user_id', typed.id)
        .eq('gallery_type', 'portfolio')
      const fallbackGallery = pickFreeDisplayedGallery(allGalleries || [])
      if (fallbackGallery) {
        galleriesQuery = galleriesQuery.eq('id', fallbackGallery.id)
      } else {
        // No public portfolio galleries - return empty
        galleriesQuery = galleriesQuery.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }
  } else {
    // PRO: show all public portfolio galleries
    galleriesQuery = galleriesQuery.eq('is_public', true)
  }

  const { data: galleries, error: galleriesError } = await galleriesQuery.order('created_at', { ascending: false })

  console.log('[photographer-portfolio] galleries query', {
    slug: decodedSlug,
    count: galleries?.length ?? 0,
    error: galleriesError?.message ?? null,
  })

  const galleryNameSet = new Set<string>()
  const allPhotos: PortfolioPhoto[] = []

  for (const gallery of galleries ?? []) {
    const galleryRow = gallery as {
      id: string
      title: string
    }
    const galleryName = galleryRow.title.trim()
    if (galleryName) galleryNameSet.add(galleryName)

    const photos = await fetchPublicGalleryDisplayPhotos(admin, galleryRow.id, {
      limit: isFree ? getGalleryPhotoLimit(entitlements) : undefined,
      random: isFree,
    })

    for (const photo of photos) {
      if (photo.url) {
        allPhotos.push({
          id: photo.id,
          url: photo.url,
          galleryId: galleryRow.id,
          galleryName,
        })
      }
    }
  }

  const galleryNames = Array.from(galleryNameSet).sort((a, b) =>
    a.localeCompare(b, 'he')
  )

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  // See app/[slug]/page.tsx for why: on a photographer's connected custom
  // domain, nav links built from the real slug path would 404 there (only a
  // small fixed set of tenant-relative paths is recognized — see
  // lib/domains/rewrite.ts), so an empty base is used for concatenation
  // instead. canonicalPath itself (used above for the separated-mode
  // redirect) is unaffected.
  const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
  const navBasePath = isTenantDomain ? '' : canonicalPath
  const homepagePath = isTenantDomain ? '/' : resolveHomepagePath(typed.slug, typed.studio_name)
  const portfolioPath = `${navBasePath}/portfolio`
  const blogPath = `${navBasePath}/blog`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = canUseFeature(entitlements, 'faq') && sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

  const [{ count: packageCount }, { count: postCount }, { count: photoEditCount }] =
    await Promise.all([
      admin
        .from('photography_packages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', typed.id)
        .eq('is_active', true),
      admin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', typed.id),
      admin
        .from('photo_edit_comparisons')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', typed.id)
        .eq('is_active', true),
    ])

  const hasPackages = canUseFeature(entitlements, 'packages') && (packageCount ?? 0) > 0
  const hasBlog = canUseFeature(entitlements, 'posts') && (postCount ?? 0) > 0
  const hasPhotoEditComparisons = canUseFeature(entitlements, 'before_after') && (photoEditCount ?? 0) > 0

  if (await isReactPublicSiteEnabled()) {
    const viewModel = buildPortfolioViewModel({
      photographer: {
        studio_name: typed.studio_name,
        name: typed.name,
        logo_url: logoUrl,
        should_color_logo: typed.should_color_logo,
        accent_color: typed.accent_color,
        heading_font: typed.heading_font,
        about_title_font: typed.about_title_font,
        site_language: typed.site_language,
        galleries_title: typed.galleries_title,
        contact_card_title: typed.contact_card_title,
        contact_card_description: typed.contact_card_description,
        gallery_layout_mode: typed.gallery_layout_mode,
      },
      photos: allPhotos,
      galleryNames,
      homepagePath,
      portfolioPath,
      blogPath,
      beforeAfterPath: `${navBasePath}/before-after`,
      hasFaq,
      hasPackages,
      hasBlog,
      hasPhotoEditComparisons,
    })

    if (typed.selected_theme === 'dark' || typed.selected_theme === 'bold') {
      return <DarkPortfolioShell pageProps={toDarkPortfolioPageProps(viewModel)} />
    }

    if (typed.selected_theme === 'elegant') {
      return <ElegantPortfolioShell pageProps={toElegantPortfolioPageProps(viewModel)} />
    }

    if (typed.selected_theme === 'modern') {
      return <ModernPortfolioShell pageProps={toModernPortfolioPageProps(viewModel)} />
    }

    return <ClassicPortfolioShell pageProps={toClassicPortfolioPageProps(viewModel)} />
  }

  const html = generatePublicPortfolioPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    portfolioPath,
    hasFaq,
    hasPackages,
    hasBlog,
    blogPath,
    hasPhotoEditComparisons,
    beforeAfterPath: hasPhotoEditComparisons ? `${navBasePath}/before-after` : undefined,
    shouldColorLogo: typed.should_color_logo ?? false,
    portfolio: {
      pageTitle: 'תיק עבודות',
      sectionTitle: resolvePortfolioGalleriesSectionTitle(typed.galleries_title),
      photos: allPhotos,
      galleryNames,
      accentColor,
      contactCardTitle: typed.contact_card_title ?? null,
      contactCardDescription: typed.contact_card_description ?? null,
    },
    siteLanguage: typed.site_language,
    headingFont: typed.heading_font,
    aboutTitleFont: typed.about_title_font,
  })

  return <HtmlFramePage html={html} title={`תיק עבודות | ${studioName}`} />
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'תיק עבודות לא נמצא' }

    const typed = photographer as typeof photographer & {
      gallery_layout_mode: string | null
    }

    if ((typed.gallery_layout_mode ?? 'separated') !== 'portfolio') {
      return { title: 'תיק עבודות לא נמצא' }
    }

    const studioName = typed.studio_name ?? 'Studio Gallery'
    const baseUrl = await getCanonicalBaseUrl(typed.id)
    const canonicalPath = baseUrl
      ? ''
      : (getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`)
    const portfolioPath = `${canonicalPath}/portfolio`
    const title = `תיק עבודות | ${studioName}`
    const description = `תיק העבודות של ${studioName}`
    const googleSiteVerificationToken = await getGoogleSiteVerificationToken(typed.id)
    const logoIconUrl =
      getBrandingFaviconPublicUrl(typed.id, typed.logo_url) ??
      getBrandingPublicMediaUrl(typed.logo_url)

    return {
      title,
      description,
      ...(googleSiteVerificationToken ? { verification: { google: googleSiteVerificationToken } } : {}),
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
        canonical: buildCanonicalUrl(portfolioPath, baseUrl),
      },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: portfolioPath,
        baseUrl,
      }),
    }
  } catch {
    return { title: 'תיק עבודות לא נמצא' }
  }
}
