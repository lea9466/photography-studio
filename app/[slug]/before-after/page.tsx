import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { HtmlFramePage } from '@/components/photographer/HtmlFramePage'
import { generatePublicBeforeAfterPageHTML } from '@/lib/public-before-after-html'
import { resolvePhotoEditDisplayUrl } from '@/lib/photo-edit-image-url'
import { normalizeSiteTheme, resolveHomepagePath } from '@/lib/photographer-site-paths'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { buildCanonicalUrl, buildPublicOpenGraph } from '@/lib/seo/public-metadata'
import { resolveSiteLanguage } from '@/lib/site-language'
import type { PhotoEditComparisonRow as DbRow } from '@/lib/types/database.types'

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
        displayStyle: row.display_style,
      }
    })
  )

  const visibleItems = items.filter((item) => item.originalImageUrl && item.editedImageUrl)
  if (visibleItems.length === 0) notFound()

  const siteTheme = normalizeSiteTheme(typed.selected_theme)
  const accentColor = typed.accent_color ?? '#7c3aed'
  const studioName = typed.studio_name ?? 'Studio Gallery'
  const homepagePath = resolveHomepagePath(typed.slug, typed.studio_name)
  const canonicalPath = getPublicSitePath(typed.slug, typed.studio_name) ?? `/${decodedSlug}`
  const beforeAfterPath = `${canonicalPath}/before-after`
  const blogPath = `${canonicalPath}/blog`
  const portfolioPath = `${canonicalPath}/portfolio`
  const logoUrl = await resolveBrandingPath(typed.logo_url)
  const hasFaq = sanitizeFaqItems(parseFaqItems(typed.faq_items)).length > 0
  const language = resolveSiteLanguage(typed.site_language)
  const pageTitle = language === 'en' ? 'Before & After Editing' : 'לפני ואחרי עיבוד'
  const intro =
    language === 'en'
      ? 'Move the lens and discover the path from the original image to the final result.'
      : 'הזיזו את העדשה וגלו את הדרך מהתמונה המקורית אל התוצאה הסופית.'

  const [{ count: packageCount }, { count: postCount }] = await Promise.all([
    admin
      .from('photography_packages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', typed.id)
      .eq('is_active', true),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', typed.id),
  ])

  const galleryLayoutMode =
    typed.gallery_layout_mode === 'portfolio' ? 'portfolio' : 'separated'

  const html = generatePublicBeforeAfterPageHTML({
    theme: siteTheme,
    studioName,
    logoUrl,
    homepagePath,
    beforeAfterPath,
    blogPath,
    hasFaq,
    hasPackages: (packageCount ?? 0) > 0,
    hasBlog: (postCount ?? 0) > 0,
    shouldColorLogo: typed.should_color_logo ?? false,
    galleryLayoutMode,
    portfolioPath: galleryLayoutMode === 'portfolio' ? portfolioPath : undefined,
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
    const canonicalPath =
      getPublicSitePath(photographer.slug, photographer.studio_name) ?? `/${decodedSlug}`
    const beforeAfterPath = `${canonicalPath}/before-after`
    const title = `${pageTitle} | ${studioName}`

    return {
      title,
      description,
      alternates: { canonical: buildCanonicalUrl(beforeAfterPath) },
      openGraph: buildPublicOpenGraph({
        title,
        description,
        canonicalPath: beforeAfterPath,
        imageUrl: null,
      }),
    }
  } catch {
    return { title: 'לפני ואחרי עיבוד' }
  }
}
