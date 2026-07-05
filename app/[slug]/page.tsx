import { notFound } from 'next/navigation'
import { PhotographerHomepage } from '@/components/photographer/PhotographerHomepage'
import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug } from '@/lib/queries/public-photographer'
import { resolveBrandingPath, resolveBrandingPaths } from '@/lib/branding-urls'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { resolveTestimonialImageUrl } from '@/lib/testimonial-image-url'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PhotographerPage({ params }: PageProps) {
  const { slug } = await params

  try {
    const admin = createAdminClient()
    const decodedSlug = decodeURIComponent(slug)
    const photographer = await findPhotographerBySlug(decodedSlug)

    if (!photographer) {
      notFound()
    }

    // Type assertion to fix TypeScript inference
    const typedPhotographer = photographer as any

    // Fetch public portfolio galleries (all galleries with is_public = true)
    const { data: galleries } = await admin
      .from('galleries')
      .select('id, title, slug, created_at, cover_image')
      .eq('user_id', typedPhotographer.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(4)

    // Fetch first photo for each gallery with smart fallback logic
    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        // Use cover_image if available (only for public galleries)
        if (gallery.cover_image) {
          const coverUrl = gallery.cover_image.startsWith('http')
            ? gallery.cover_image
            : gallery.cover_image.startsWith('cover-images/')
              ? `/api/gallery-media?key=${encodeURIComponent(gallery.cover_image)}`
              : await resolveMediaUrl('branding', gallery.cover_image)
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

    const testimonialsWithUrls = await Promise.all(
      (testimonials || []).map(async (testimonial: any) => ({
        ...testimonial,
        image_url: await resolveTestimonialImageUrl(testimonial.image_url),
      }))
    )

    return (
      <>
        <PhotographerHomepage
          photographer={photographerWithUrls}
          galleries={galleriesWithSignedUrls}
          packages={packages || []}
          testimonials={testimonialsWithUrls}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading photographer page:', error)
    if (
      process.env.NODE_ENV === 'development' &&
      error instanceof Error &&
      (error.message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        error.message.includes('Missing database permissions'))
    ) {
      throw error
    }
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  try {
    const decodedSlug = decodeURIComponent(slug)
    const photographer = await findPhotographerBySlug(decodedSlug)

    if (!photographer) {
      return {
        title: 'סטודיו גלריה',
      }
    }

    const typedPhotographer = photographer as any

    return {
      title: `${typedPhotographer.studio_name || typedPhotographer.name} | סטודיו גלריה`,
      description: typedPhotographer.about_text || 'סטודיו לצילום מקצועי',
    }
  } catch (error) {
    return {
      title: 'סטודיו גלריה',
    }
  }
}
