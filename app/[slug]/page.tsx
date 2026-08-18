import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PhotographerHomepage } from '@/components/photographer/PhotographerHomepage'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug, getPublicSitePath } from '@/lib/queries/public-photographer'
import {
  applyOwnerPreviewBypass,
  resolvePublicSiteGateBySlug,
} from '@/lib/site-access/public-gate'
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
import { PhotographerSemanticAnchors } from '@/components/seo/PhotographerSemanticAnchors'
import type { PublicBlogPost } from '@/lib/public-blog-html'
import {
  fetchPhotographerDiscoveryGalleries,
  fetchPhotographerDiscoveryPosts,
} from '@/lib/seo/photographer-discovery'
import { formatSiteDate, resolveSiteLanguage } from '@/lib/site-language'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { canUseFeature } from '@/lib/subscriptions/entitlements'
import { pickFreeDisplayedGallery } from '@/lib/subscriptions/entitlements'

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

export default async function PhotographerPage({ params }: PageProps) {
  const { slug } = await params

  try {
    const admin = createAdminClient()
    const decodedSlug = decodeURIComponent(slug)

    // Layout already renders the gate UI; bail early to skip heavy homepage work.
    // Owners can still preview while under construction.
    if (
      await applyOwnerPreviewBypass(await resolvePublicSiteGateBySlug(decodedSlug))
    ) {
      return null
    }

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

    // Fetch entitlements for public gating
    const entitlements = await getStudioEntitlements(typedPhotographer.id)
    const isFree = !entitlements.isPro

    // For FREE users: determine the single displayed gallery
    let displayedGalleryId: string | null = null
    if (isFree) {
      // Use user-selected gallery if set, otherwise pick earliest public gallery
      displayedGalleryId = typedPhotographer.displayed_gallery_id ?? null
    }

    let galleriesQuery = admin
      .from('galleries')
      .select('id, title, slug, created_at, cover_image')
      .eq('user_id', typedPhotographer.id)
      .order('created_at', { ascending: false })

    if (isFree) {
      // FREE: only show the selected displayed gallery — and only if it's
      // still public. A gallery can be switched to private after being
      // selected as "displayed", so this must be re-checked on every read,
      // not just at selection time.
      if (displayedGalleryId) {
        galleriesQuery = galleriesQuery
          .eq('id', displayedGalleryId)
          .eq('is_public', true)
      } else {
        // Fallback: pick earliest public gallery deterministically
        const { data: allGalleries } = await admin
          .from('galleries')
          .select('id, is_public, created_at')
          .eq('user_id', typedPhotographer.id)
        const fallbackGallery = pickFreeDisplayedGallery(allGalleries || [])
        if (fallbackGallery) {
          galleriesQuery = galleriesQuery.eq('id', fallbackGallery.id)
        } else {
          // No public galleries - return empty
          galleriesQuery = galleriesQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        }
      }
    } else {
      // PRO: only show public galleries. Under plain MVP mode every gallery
      // is forced public at creation, so this is a no-op for most accounts —
      // but bypass accounts (see isMvpBypassUser) can have real private
      // galleries, and those must never appear on the public homepage.
      galleriesQuery = galleriesQuery.eq('is_public', true)
    }

    // PRO: limit to 4 galleries for homepage; FREE: limit to 1 (already filtered above)
    if (!isFree) {
      galleriesQuery = galleriesQuery.limit(4)
    }

    const { data: galleries } = await galleriesQuery

    // Fetch first photo for each gallery with smart fallback logic
    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        // Use cover_image if available (only for public galleries)
        if (gallery.cover_image) {
          const coverUrl = gallery.cover_image.startsWith('http')
            ? gallery.cover_image
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

    // Fetch active photography packages (PRO only)
    let packages = [] as any[]
    if (canUseFeature(entitlements, 'packages')) {
      const { data } = await admin
        .from('photography_packages')
        .select('id, name, price_amount, duration_text, includes, sort_order, is_featured')
        .eq('user_id', typedPhotographer.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      packages = data || []
    } else {
      packages = []
    }

    // Count posts / active before-after pairs (PRO only)
    let postCount = 0
    let photoEditComparisonsCount = 0
    if (canUseFeature(entitlements, 'posts') || canUseFeature(entitlements, 'before_after')) {
      const [
        { count: postCountResult },
        { count: photoEditComparisonsCountResult, error: photoEditCountError },
      ] = await Promise.all([
        admin
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', typedPhotographer.id),
        admin
          .from('photo_edit_comparisons')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', typedPhotographer.id)
          .eq('is_active', true),
      ])
      postCount = postCountResult ?? 0
      photoEditComparisonsCount = photoEditComparisonsCountResult ?? 0
    } else {
      postCount = 0
      photoEditComparisonsCount = 0
    }

    // Fetch the latest posts for the homepage "latest posts" section (PRO only)
    let latestPosts: HomepagePostRow[] = []
    if (canUseFeature(entitlements, 'posts')) {
      const { data: latestPostsData } = await admin
        .from('posts')
        .select(
          'id, title, subtitle, content, auto_apply_watermark, cover_photo_id, created_at, post_photos!post_photos_post_id_fkey(id, preview_url, watermarked_preview_url, sort_order)'
        )
        .eq('user_id', typedPhotographer.id)
        .order('created_at', { ascending: false })
        .limit(3)

      latestPosts = (latestPostsData ?? []) as HomepagePostRow[]
    } else {
      latestPosts = []
    }

    // Process posts for homepage (only if posts feature is enabled)
    let homepagePosts: PublicBlogPost[] = []
    if (canUseFeature(entitlements, 'posts') && latestPosts.length > 0) {
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

      const siteLanguage = resolveSiteLanguage(typedPhotographer.site_language)

      homepagePosts = latestPosts.map((post) => {
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
          date: formatSiteDate(post.created_at, siteLanguage),
          coverUrl,
          images,
        }
      })
    } else {
      homepagePosts = []
    }

    // Fetch client testimonials/reviews (PRO only)
    let testimonials = [] as any[]
    if (canUseFeature(entitlements, 'testimonials')) {
      const { data } = await admin
        .from('testimonials')
        .select('id, title, content, shoot_type, review_date, created_at, is_featured, sort_order, image_url')
        .eq('user_id', typedPhotographer.id)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('review_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      testimonials = data || []
    } else {
      testimonials = []
    }

    // Resolve R2 paths to signed URLs (only if not already a full URL).
    // Every resolveBrandingPath/resolveBrandingPaths call here is independent
    // (no shared state, no ordering dependency), so they all run concurrently
    // instead of one-after-another — same results, far less wall-clock time.
    const isVideoHero = typedPhotographer.hero_type === 'video' && canUseFeature(entitlements, 'hero_video')
    const hasFaq = canUseFeature(entitlements, 'faq')

    const [
      heroDesktopUrl,
      heroMobileUrl,
      heroDesktopUrls,
      heroMobileUrls,
      heroVideoUrl,
      aboutImageUrl,
      contactDesktopUrl,
      contactMobileUrl,
      packagesDesktopUrl,
      packagesMobileUrl,
      faqSectionImageUrl,
      logoUrl,
    ] = await Promise.all([
      resolveBrandingPath(typedPhotographer.hero_desktop_url),
      resolveBrandingPath(typedPhotographer.hero_mobile_url),
      resolveBrandingPaths(
        typedPhotographer.hero_desktop_urls?.length
          ? typedPhotographer.hero_desktop_urls
          : typedPhotographer.hero_desktop_url
            ? [typedPhotographer.hero_desktop_url]
            : []
      ),
      resolveBrandingPaths(
        typedPhotographer.hero_mobile_urls?.length
          ? typedPhotographer.hero_mobile_urls
          : typedPhotographer.hero_mobile_url
            ? [typedPhotographer.hero_mobile_url]
            : []
      ),
      // For FREE users: force hero_type to 'images' and hide hero video
      isVideoHero ? resolveBrandingPath(typedPhotographer.hero_video_url) : Promise.resolve(null),
      resolveBrandingPath(typedPhotographer.about_image_url),
      resolveBrandingPath(typedPhotographer.contact_desktop_url),
      resolveBrandingPath(typedPhotographer.contact_mobile_url),
      resolveBrandingPath(typedPhotographer.packages_desktop_url),
      resolveBrandingPath(typedPhotographer.packages_mobile_url),
      // For FREE users: hide FAQ section image
      hasFaq ? resolveBrandingPath(typedPhotographer.faq_section_image_url) : Promise.resolve(null),
      resolveBrandingPath(typedPhotographer.logo_url),
    ])

    // For FREE users: hide FAQ items
    const faqItems = hasFaq ? typedPhotographer.faq_items : []

    const photographerWithUrls = {
      ...typedPhotographer,
      hero_desktop_url: heroDesktopUrl,
      hero_mobile_url: heroMobileUrl,
      hero_desktop_urls: heroDesktopUrls,
      hero_mobile_urls: heroMobileUrls,
      hero_video_url: heroVideoUrl,
      about_image_url: aboutImageUrl,
      contact_desktop_url: contactDesktopUrl,
      contact_mobile_url: contactMobileUrl,
      packages_desktop_url: packagesDesktopUrl,
      packages_mobile_url: packagesMobileUrl,
      faq_section_image_url: faqSectionImageUrl,
      faq_items: faqItems,
      logo_url: logoUrl,
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
    const studioName =
      typedPhotographer.studio_name || typedPhotographer.name || 'סטודיו גלריה'
    const [discoveryGalleries, discoveryPosts] = await Promise.all([
      fetchPhotographerDiscoveryGalleries(typedPhotographer.id),
      fetchPhotographerDiscoveryPosts(typedPhotographer.id),
    ])
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
        <PhotographerSemanticAnchors
          studioPath={canonicalPath}
          studioName={studioName}
          galleries={discoveryGalleries}
          posts={discoveryPosts}
        />
        <PhotographerHomepage
          photographer={photographerWithUrls}
          galleries={galleriesWithPools}
          packages={packages || []}
          testimonials={testimonialsWithUrls}
          postCount={postCount ?? 0}
          photoEditComparisonsCount={photoEditComparisonsCount ?? 0}
          blogPath={`${canonicalPath}/blog`}
          portfolioPath={`${canonicalPath}/portfolio`}
          studioPath={canonicalPath}
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
