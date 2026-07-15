import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { fetchPublicGalleryDisplayPhotos } from '@/lib/queries/public-gallery-photos'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import {
  generatePublicPortfolioPageHTML,
  type PortfolioPhoto,
} from '@/lib/public-portfolio-html'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'

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
    console.log('[photographer-portfolio] separated mode redirect', {
      slug: decodedSlug,
      redirectTo: `${canonicalPath}#${galleryHash}`,
    })
    redirect(`${canonicalPath}#${galleryHash}`)
  }

  const admin = createAdminClient()

  const { data: galleries, error: galleriesError } = await admin
    .from('galleries')
    .select('id, title, created_at, gallery_type, is_public')
    .eq('user_id', typed.id)
    .eq('is_public', true)
    .eq('gallery_type', 'portfolio')
    .order('created_at', { ascending: false })

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

    const photos = await fetchPublicGalleryDisplayPhotos(admin, galleryRow.id)

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
  const homepagePath = resolveHomepagePath(typed.slug, typed.studio_name)
  const portfolioPath = `${canonicalPath}/portfolio`
  const blogPath = `${canonicalPath}/blog`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0

  const { count: packageCount } = await admin
    .from('photography_packages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', typed.id)
    .eq('is_active', true)

  const { count: postCount } = await admin
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', typed.id)

  const html = generatePublicPortfolioPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    portfolioPath,
    hasFaq,
    hasPackages: (packageCount ?? 0) > 0,
    hasBlog: (postCount ?? 0) > 0,
    blogPath,
    shouldColorLogo: typed.should_color_logo ?? false,
    portfolio: {
      pageTitle: 'תיק עבודות',
      photos: allPhotos,
      galleryNames,
      accentColor,
      contactCardTitle: typed.contact_card_title ?? null,
      contactCardDescription: typed.contact_card_description ?? null,
    },
    siteLanguage: typed.site_language,
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
    const canonicalPath =
      getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`
    const portfolioPath = `${canonicalPath}/portfolio`
    const title = `תיק עבודות | ${studioName}`
    const description = `תיק העבודות של ${studioName}`

    return {
      title,
      description,
      alternates: {
        canonical: buildCanonicalUrl(portfolioPath),
      },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: portfolioPath,
      }),
    }
  } catch {
    return { title: 'תיק עבודות לא נמצא' }
  }
}
