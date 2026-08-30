import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { TENANT_HOST_HEADER } from '@/lib/domains/rewrite'
import { getCanonicalBaseUrl, getGoogleSiteVerificationToken } from '@/lib/domains/custom-domain-lookup'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBeforeAfterPageHTML } from '@/lib/public-before-after-html'
import { resolvePhotoEditDisplayUrl } from '@/lib/photo-edit-image-url'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import { resolveSiteLanguage } from '@/lib/site-language'
import type { PhotoEditComparisonRow as DbRow } from '@/lib/types/database.types'
import { normalizeBeforeAfterDisplayStyle } from '@/lib/types/before-after-display-style'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'
import { isReactPublicSiteEnabled } from '@/lib/public-site/react-rollout'
import { buildBeforeAfterViewModel } from '@/lib/public-site/adapters/build-before-after-view-model'
import { toClassicBeforeAfterPageProps } from '@/lib/public-site/adapters/theme-props/classic'
import { ClassicBeforeAfterShell } from '@/components/photographer/react-site/ClassicBeforeAfterShell'
import { toDarkBeforeAfterPageProps } from '@/lib/public-site/adapters/theme-props/dark'
import { DarkBeforeAfterShell } from '@/components/photographer/react-site/DarkBeforeAfterShell'
import { toElegantBeforeAfterPageProps } from '@/lib/public-site/adapters/theme-props/elegant'
import { ElegantBeforeAfterShell } from '@/components/photographer/react-site/ElegantBeforeAfterShell'
import { toModernBeforeAfterPageProps } from '@/lib/public-site/adapters/theme-props/modern'
import { ModernBeforeAfterShell } from '@/components/photographer/react-site/ModernBeforeAfterShell'

interface BeforeAfterPageProps {
  params: Promise<{ slug: string }>
}

export default async function BeforeAfterPage({ params }: BeforeAfterPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const photographer = await findPhotographerBySlug(decodedSlug)

  if (!photographer) notFound()

  const typed = photographer as typeof photographer & {
    id: string
    gallery_layout_mode: string | null
  }

  // Check entitlements for before_after feature
  const entitlements = await getStudioEntitlements(typed.id)
  if (!canUseFeature(entitlements, 'before_after')) {
    notFound()
  }

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('photo_edit_comparisons')
    .select('*')
    .eq('user_id', typed.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) notFound()

  const comparisons = (rows ?? []) as DbRow[]
  if (comparisons.length === 0) notFound()

  const items = await Promise.all(
    comparisons.map(async (row) => {
      const autoApplyWatermark = row.auto_apply_watermark ?? true
      const [originalImageUrl, editedImageUrl] = await Promise.all([
        resolvePhotoEditDisplayUrl({
          previewPath: row.original_image_url,
          watermarkedPath: row.original_watermarked_url,
          autoApplyWatermark,
        }),
        resolvePhotoEditDisplayUrl({
          previewPath: row.edited_image_url,
          watermarkedPath: row.edited_watermarked_url,
          autoApplyWatermark,
        }),
      ])

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        originalImageUrl: originalImageUrl ?? '',
        editedImageUrl: editedImageUrl ?? '',
      }
    })
  )

  const visibleItems = items.filter((item) => item.originalImageUrl && item.editedImageUrl)
  if (visibleItems.length === 0) notFound()

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  // See app/[slug]/page.tsx for why: on a photographer's connected custom
  // domain, nav links built from the real slug path would 404 there (only a
  // small fixed set of tenant-relative paths is recognized — see
  // lib/domains/rewrite.ts), so an empty base is used for concatenation
  // instead. canonicalPath itself (used below for the canonical/OG tags via
  // generateMetadata, computed separately) is unaffected.
  const isTenantDomain = (await headers()).has(TENANT_HOST_HEADER)
  const homepagePath = isTenantDomain ? '/' : resolveHomepagePath(typed.slug, typed.studio_name)
  const navBasePath = isTenantDomain
    ? ''
    : (getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`)
  const beforeAfterPath = `${navBasePath}/before-after`
  const blogPath = `${navBasePath}/blog`
  const portfolioPath = `${navBasePath}/portfolio`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = canUseFeature(entitlements, 'faq') && sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0
  const language = resolveSiteLanguage(typed.site_language)
  const displayStyle = normalizeBeforeAfterDisplayStyle(typed.before_after_display_style)
  const pageTitle = language === 'en' ? 'Before & After Editing' : 'לפני ואחרי עיבוד'
  const intro =
    language === 'en'
      ? displayStyle === 'split_slider'
        ? 'Drag the divider to compare the original image with the final result.'
        : 'Move the lens and discover the path from the original image to the final result.'
      : displayStyle === 'split_slider'
        ? 'גררו את המחיצה והשוו בין התמונה המקורית לבין התוצאה הסופית.'
        : 'הזיזו את העדשה וגלו את הדרך מהתמונה המקורית אל התוצאה הסופית.'

  const [{ count: packageCount }, { count: postCount }] = await Promise.all([
    admin
      .from('photography_packages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', typed.id)
      .eq('is_active', true),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', typed.id),
  ])

  const hasPackages = canUseFeature(entitlements, 'packages') && (packageCount ?? 0) > 0
  const hasBlog = canUseFeature(entitlements, 'posts') && (postCount ?? 0) > 0
  const galleryLayoutMode =
    typed.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated'

  if (await isReactPublicSiteEnabled()) {
    const viewModel = buildBeforeAfterViewModel({
      photographer: {
        studio_name: typed.studio_name,
        name: typed.name,
        logo_url: logoUrl,
        should_color_logo: typed.should_color_logo,
        accent_color: typed.accent_color,
        heading_font: typed.heading_font,
        about_title_font: typed.about_title_font,
        site_language: typed.site_language,
        gallery_layout_mode: typed.gallery_layout_mode,
        before_after_display_style: typed.before_after_display_style,
      },
      items: visibleItems,
      homepagePath,
      blogPath,
      portfolioPath,
      beforeAfterPath,
      hasFaq,
      hasPackages,
      hasBlog,
    })

    if (typed.selected_theme === 'dark' || typed.selected_theme === 'bold') {
      return <DarkBeforeAfterShell pageProps={toDarkBeforeAfterPageProps(viewModel)} />
    }

    if (typed.selected_theme === 'elegant') {
      return <ElegantBeforeAfterShell pageProps={toElegantBeforeAfterPageProps(viewModel)} />
    }

    if (typed.selected_theme === 'modern') {
      return <ModernBeforeAfterShell pageProps={toModernBeforeAfterPageProps(viewModel)} />
    }

    return <ClassicBeforeAfterShell pageProps={toClassicBeforeAfterPageProps(viewModel)} />
  }

  const html = generatePublicBeforeAfterPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    beforeAfterPath,
    blogPath,
    hasFaq,
    hasPackages,
    hasBlog,
    shouldColorLogo: typed.should_color_logo ?? false,
    galleryLayoutMode,
    portfolioPath: galleryLayoutMode === 'portfolio' ? portfolioPath : undefined,
    displayStyle,
    page: {
      pageTitle,
      intro,
      accentColor,
      items: visibleItems,
    },
    siteLanguage: typed.site_language,
  })

  return <HtmlFramePage html={html} title={`${pageTitle} | ${studioName}`} />
}

export async function generateMetadata({ params }: BeforeAfterPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  try {
    const photographer = await findPhotographerBySlug(decodedSlug)
    if (!photographer) return { title: 'לפני ואחרי עיבוד' }

    const studioName = photographer.studio_name ?? 'Studio Gallery'
    const language = resolveSiteLanguage(photographer.site_language)
    const pageTitle = language === 'en' ? 'Before & After Editing' : 'לפני ואחרי עיבוד'
    const description =
      language === 'en'
        ? `See before and after professional edits by ${studioName}.`
        : `צפו בתמונות לפני ואחרי עיבוד מקצועי של ${studioName}.`
    const baseUrl = await getCanonicalBaseUrl(photographer.id)
    const canonicalPath = baseUrl
      ? ''
      : (getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`)
    const beforeAfterPath = `${canonicalPath}/before-after`
    const title = `${pageTitle} | ${studioName}`
    const googleSiteVerificationToken = await getGoogleSiteVerificationToken(photographer.id)
    const logoIconUrl =
      getBrandingFaviconPublicUrl(photographer.id, photographer.logo_url) ??
      getBrandingPublicMediaUrl(photographer.logo_url)

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
      alternates: { canonical: buildCanonicalUrl(beforeAfterPath, baseUrl) },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: beforeAfterPath,
        imageUrl: null,
        baseUrl,
      }),
    }
  } catch {
    return { title: 'לפני ואחרי עיבוד' }
  }
}
