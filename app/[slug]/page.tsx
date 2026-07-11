import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PhotographerHomepage } from '@/components/photographer/PhotographerHomepage'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import { resolveSlugRedirect } from '@/lib/referral/slug-redirect'
import {
  buildPhotographerDescription,
  buildPhotographerKeywords,
  buildPhotographerLocalBusinessJsonLd,
} from '@/lib/seo/local-business-schema'
import {
  buildCanonicalUrl,
  buildPublicOpenGraph,
  resolveGalleryCoverCardPath,
  resolvePhotographerShareImage,
} from '@/lib/seo/public-metadata'
import { getBrandingFaviconPublicUrl, getBrandingPublicMediaUrl } from '@/lib/branding-public-url'
import Script from 'next/script'
import { resolveBrandingPath, resolveBrandingPaths } from '@/lib/branding-urls'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { resolveTestimonialImageUrl } from '@/lib/testimonial-image-url'
import {
  buildLandscapePreferredPool,
  type PhotoCandidate,
} from '@/lib/homepage-photo-pool'
import { PUBLIC_ONLY_MVP } from '@/lib/types/app.types'
import type { PublicBlogPost } from '@/lib/public-blog-html'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

type HomepagePostPhotoRow = {
  id: string
  preview_url: string | null
  watermarked_preview_url: string | null
  sort_order: number
}

type HomepagePostRow = {
  id: string
  title: string
  subtitle: string | null
  content: string
  auto_apply_watermark: boolean
  cover_photo_id: string | null
  created_at: string
  post_photos: HomepagePostPhotoRow[]
}

function formatPostDate(value: string) {
  return new Date(value).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function PhotographerPage({ params }: PageProps) {
  const { slug } = await params

  try {
    const admin = createAdminClient()
    const decodedSlug = decodeURIComponent(slug)
    const photographer = await findPhotographerBySlug(decodedSlug)

    if (!photographer) {
      const redirectSlug = await resolveSlugRedirect(decodedSlug)
      if (redirectSlug) {
        permanentRedirect(`/${encodeURIComponent(redirectSlug)}`)
      }
      notFound()
    }

    // Type assertion to fix TypeScript inference
    const typedPhotographer = photographer as any

    let galleriesQuery = admin
      .from('galleries')
      .select('id, title, slug, created_at, cover_image')
      .eq('user_id', typedPhotographer.id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (!PUBLIC_ONLY_MVP) {
      galleriesQuery = galleriesQuery.eq('is_public', true)
    }

    const { data: galleries } = await galleriesQuery

    // Fetch first photo for each gallery with smart fallback logic
    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        // Use cover_image if available (only for public galleries)
        if (gallery.cover_image) {
          const coverUrl = gallery.cover_image.startsWith('http')
            ? gallery.cover_image
            : gallery.cover_image.startsWith('cover-images/')
              ? `/api/gallery-media?key=${encodeURIComponent(gallery.cover_image)}`
              : await resolveGalleryCoverCardPath(gallery.cover_image, gallery.id)
          return {
            ...gallery,
            preview_url: coverUrl,
          }
        }

        // Check if gallery has any edited photos
        const { data: editedPhotos } = await admin
          .from('edited_photos')
          .select('final_url')
          .eq('gallery_id', gallery.id)
          .limit(1)

        let previewUrl: string | null = null

        if (editedPhotos && editedPhotos.length > 0) {
          // Use edited photos if available (protects client raw files)
          const { data: firstEditedPhoto } = await admin
            .from('edited_photos')
            .select('final_url')
            .eq('gallery_id', gallery.id)
            .limit(1)
            .maybeSingle()
          previewUrl = (firstEditedPhoto as any)?.final_url || null
        } else {
          // Fall back to regular photos if no edited photos exist (portfolio showcase)
          const { data: firstPhoto } = await admin
            .from('photos')
            .select('preview_url')
            .eq('gallery_id', gallery.id)
            .eq('is_visible_to_client', true)
            .order('sort_order', { ascending: true })
            .limit(1)
            .maybeSingle()
          previewUrl = (firstPhoto as any)?.preview_url || null
        }

        return {
          ...gallery,
          preview_url: previewUrl,
        }
      })
    )

    // Fetch active photography packages
    const { data: packages } = await admin
      .from('photography_packages')
      .select('id, name, price_amount, duration_text, includes, sort_order, is_featured')
      .eq('user_id', typedPhotographer.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Count posts to conditionally show the blog link in the header
    const { count: postCount } = await admin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', typedPhotographer.id)

    // Fetch the latest posts for the homepage "latest posts" section
    const { data: latestPostsData } = await admin
      .from('posts')
      .select(
        'id, title, subtitle, content, auto_apply_watermark, cover_photo_id, created_at, post_photos!post_photos_post_id_fkey(id, preview_url, watermarked_preview_url, sort_order)'
      )
      .eq('user_id', typedPhotographer.id)
      .order('created_at', { ascending: false })
      .limit(3)

    const latestPosts = (latestPostsData ?? []) as HomepagePostRow[]

    const postPreviewPaths: string[] = []
    const postWatermarkedPaths: string[] = []
    for (const post of latestPosts) {
      for (const photo of post.post_photos ?? []) {
        if (post.auto_apply_watermark) {
          if (photo.watermarked_preview_url) postWatermarkedPaths.push(photo.watermarked_preview_url)
        } else if (photo.preview_url) {
          postPreviewPaths.push(photo.preview_url)
        }
      }
    }

    const emptyUrlMap: Record<string, string> = {}
    const [postPreviewUrls, postWatermarkedUrls] = await Promise.all([
      postPreviewPaths.length
        ? signStoragePaths('previews', postPreviewPaths)
        : Promise.resolve(emptyUrlMap),
      postWatermarkedPaths.length
        ? signStoragePaths('watermarked', postWatermarkedPaths)
        : Promise.resolve(emptyUrlMap),
    ])

    const resolvePostPhotoUrl = (
      post: HomepagePostRow,
      photo: HomepagePostPhotoRow
    ): string | null => {
      if (post.auto_apply_watermark) {
        return photo.watermarked_preview_url
          ? postWatermarkedUrls[photo.watermarked_preview_url] ?? null
          : photo.preview_url
            ? postPreviewUrls[photo.preview_url] ?? null
            : null
      }
      return photo.preview_url ? postPreviewUrls[photo.preview_url] ?? null : null
    }

    const homepagePosts: PublicBlogPost[] = latestPosts.map((post) => {
      const orderedPhotos = [...(post.post_photos ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      )
      const images = orderedPhotos
        .map((photo) => resolvePostPhotoUrl(post, photo))
        .filter((url): url is string => Boolean(url))
      const coverPhoto = post.cover_photo_id
        ? orderedPhotos.find((photo) => photo.id === post.cover_photo_id)
        : null
      const coverUrl = coverPhoto ? resolvePostPhotoUrl(post, coverPhoto) : images[0] ?? null

      return {
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        content: post.content,
        date: formatPostDate(post.created_at),
        coverUrl,
        images,
      }
    })

    // Fetch client testimonials/reviews (public)
    const { data: testimonials } = await admin
      .from('testimonials')
      .select('id, title, content, shoot_type, review_date, created_at, is_featured, sort_order, image_url')
      .eq('user_id', typedPhotographer.id)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('review_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Resolve R2 paths to signed URLs (only if not already a full URL)
    const photographerWithUrls = {
      ...typedPhotographer,
      hero_desktop_url: await resolveBrandingPath(typedPhotographer.hero_desktop_url),
      hero_mobile_url: await resolveBrandingPath(typedPhotographer.hero_mobile_url),
      hero_desktop_urls: await resolveBrandingPaths(
        typedPhotographer.hero_desktop_urls?.length
          ? typedPhotographer.hero_desktop_urls
          : typedPhotographer.hero_desktop_url
            ? [typedPhotographer.hero_desktop_url]
            : []
      ),
      hero_mobile_urls: await resolveBrandingPaths(
        typedPhotographer.hero_mobile_urls?.length
          ? typedPhotographer.hero_mobile_urls
          : typedPhotographer.hero_mobile_url
            ? [typedPhotographer.hero_mobile_url]
            : []
      ),
      about_image_url: await resolveBrandingPath(typedPhotographer.about_image_url),
      contact_desktop_url: await resolveBrandingPath(typedPhotographer.contact_desktop_url),
      contact_mobile_url: await resolveBrandingPath(typedPhotographer.contact_mobile_url),
      packages_desktop_url: await resolveBrandingPath(typedPhotographer.packages_desktop_url),
      packages_mobile_url: await resolveBrandingPath(typedPhotographer.packages_mobile_url),
      logo_url: await resolveBrandingPath(typedPhotographer.logo_url),
    }

    // Resolve gallery preview URLs (only if not already a full URL)
    const galleriesWithSignedUrls = await Promise.all(
      galleriesWithPhotos.map(async (gallery: any) => ({
        ...gallery,
        photographer_slug: slug,
        preview_url: gallery.preview_url?.startsWith('http')
          ? gallery.preview_url
          : gallery.preview_url ? await resolveMediaUrl('previews', gallery.preview_url) : null,
      }))
    )

    // Build a pool of photos per public gallery for the "recent photos" grid.
    // Prefer landscape photos (width > height), swapping portraits when possible.
    const galleriesWithPools = await Promise.all(
      galleriesWithSignedUrls.map(async (gallery: any) => {
        let bucket: 'previews' | 'edited' = 'previews'
        let candidates: PhotoCandidate[] = []

        const { data: editedPhotos } = await admin
          .from('edited_photos')
          .select('final_url, photos(width, height)')
          .eq('gallery_id', gallery.id)

        if (editedPhotos && editedPhotos.length > 0) {
          bucket = 'edited'
          candidates = (editedPhotos as any[])
            .map((p) => ({
              path: p.final_url as string,
              width: (p.photos as { width: number | null; height: number | null } | null)?.width ?? null,
              height: (p.photos as { width: number | null; height: number | null } | null)?.height ?? null,
            }))
            .filter((p) => Boolean(p.path))
        } else {
          const { data: regularPhotos } = await admin
            .from('photos')
            .select('preview_url, width, height')
            .eq('gallery_id', gallery.id)
            .eq('is_visible_to_client', true)
          candidates =
            (regularPhotos as any[] | null)?.map((p) => ({
              path: p.preview_url as string,
              width: p.width ?? null,
              height: p.height ?? null,
            })).filter((p) => Boolean(p.path)) ?? []
        }

        const poolPaths = buildLandscapePreferredPool(candidates)
        const signed = await signStoragePaths(bucket, poolPaths, gallery.id)
        const photoPool = poolPaths
          .map((path) =>
            path?.startsWith('http') ? path : signed[path] ?? null
          )
          .filter((url): url is string => Boolean(url))

        return {
          ...gallery,
          photo_pool: photoPool,
        }
      })
    )

    const testimonialsWithUrls = await Promise.all(
      (testimonials || []).map(async (testimonial: any) => ({
        ...testimonial,
        image_url: await resolveTestimonialImageUrl(testimonial.image_url),
      }))
    )

    const canonicalPath =
      getPublicSitePath(typedPhotographer.slug, typedPhotographer.studio_name) ?? `/${decodedSlug}`
    const shareImage = await resolvePhotographerShareImage(typedPhotographer)
    const localBusinessJsonLd = buildPhotographerLocalBusinessJsonLd({
      name: typedPhotographer.name,
      studioName: typedPhotographer.studio_name,
      aboutText: typedPhotographer.about_text,
      email: typedPhotographer.email,
      address: typedPhotographer.address,
      canonicalPath,
      imageUrl: shareImage,
    })

    return (
      <>
        <Script
          id="photographer-local-business-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
        <PhotographerHomepage
          photographer={photographerWithUrls}
          galleries={galleriesWithPools}
          packages={packages || []}
          testimonials={testimonialsWithUrls}
          postCount={postCount ?? 0}
          blogPath={`${canonicalPath}/blog`}
          portfolioPath={`${canonicalPath}/portfolio`}
          posts={homepagePosts}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading photographer page:', error)
    if (
      process.env.NODE_ENV === 'development' &&
      error instanceof Error &&
      (error.message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        error.message.includes('Missing database permissions') ||
        error.message.includes('Database schema is out of date'))
    ) {
      throw error
    }
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const decodedSlug = decodeURIComponent(slug)
    const photographer = await findPhotographerBySlug(decodedSlug)

    if (!photographer) {
      return {
        title: 'סטודיו לא נמצא | סטודיו גלריה',
        description: 'הסטודיו המבוקש אינו קיים.',
      }
    }

    const typedPhotographer = photographer as any
    const studioName = typedPhotographer.studio_name || typedPhotographer.name || 'סטודיו גלריה'
    const canonicalPath =
      getPublicSitePath(typedPhotographer.slug, typedPhotographer.studio_name) ?? `/${decodedSlug}`
    const shareImage = await resolvePhotographerShareImage(typedPhotographer)
    const logoIconUrl =
      getBrandingFaviconPublicUrl(typedPhotographer.id, typedPhotographer.logo_url) ??
      getBrandingPublicMediaUrl(typedPhotographer.logo_url)
    const description = buildPhotographerDescription({
      studioName,
      aboutText: typedPhotographer.about_text,
      address: typedPhotographer.address,
    })
    const title = studioName
    const seoTitle = typedPhotographer.address?.trim()
      ? `${studioName} - צילום מקצועי | ${typedPhotographer.address.trim()}`
      : `${studioName} - צילום מקצועי`
    const keywords = buildPhotographerKeywords({
      studioName,
      address: typedPhotographer.address,
    })

    return {
      title,
      description,
      keywords,
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
        title: seoTitle,
        description,
        canonicalPath,
        imageUrl: shareImage,
      }),
    }
  } catch (error) {
    return {
      title: 'סטודיו גלריה',
      description: 'סטודיו לצילום מקצועי',
    }
  }
}
