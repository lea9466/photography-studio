import { notFound } from 'next/navigation'
import { PhotographerHomepage } from '@/components/photographer/PhotographerHomepage'
import { createClient } from '@/lib/supabase/server'
import { resolveMediaUrl } from '@/lib/r2/storage'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PhotographerPage({ params }: PageProps) {
  const { slug } = await params

  try {
    const supabase = await createClient()

    // Decode the slug (handles URL encoding like %20 for spaces)
    const decodedSlug = decodeURIComponent(slug)
    console.log('Decoded slug:', decodedSlug)

    // Get photographer by studio_name slug
    const { data: photographer, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        studio_name,
        logo_url,
        about_text,
        stat_projects,
        stat_clients,
        stat_experience_years,
        accent_color,
        selected_theme,
        hero_desktop_url,
        hero_mobile_url,
        about_image_url,
        email
      `)
      .eq('studio_name', decodedSlug)
      .single()

    if (error || !photographer) {
      console.log('Photographer not found:', { slug: decodedSlug, error })
      notFound()
    }

    // Fetch public portfolio galleries (all galleries with is_public = true)
    const { data: galleries } = await supabase
      .from('galleries')
      .select('id, title, slug, created_at, cover_image')
      .eq('user_id', photographer.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    // Fetch first photo for each gallery with smart fallback logic
    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        // Use cover_image if available (only for public galleries)
        if (gallery.cover_image) {
          return {
            ...gallery,
            preview_url: gallery.cover_image,
          }
        }

        // Check if gallery has any edited photos
        const { data: editedPhotos } = await supabase
          .from('edited_photos')
          .select('final_url')
          .eq('gallery_id', gallery.id)
          .limit(1)

        let previewUrl: string | null = null

        if (editedPhotos && editedPhotos.length > 0) {
          // Use edited photos if available (protects client raw files)
          const { data: firstEditedPhoto } = await supabase
            .from('edited_photos')
            .select('final_url')
            .eq('gallery_id', gallery.id)
            .limit(1)
            .maybeSingle()
          previewUrl = firstEditedPhoto?.final_url || null
        } else {
          // Fall back to regular photos if no edited photos exist (portfolio showcase)
          const { data: firstPhoto } = await supabase
            .from('photos')
            .select('preview_url')
            .eq('gallery_id', gallery.id)
            .eq('is_visible_to_client', true)
            .order('sort_order', { ascending: true })
            .limit(1)
            .maybeSingle()
          previewUrl = firstPhoto?.preview_url || null
        }

        return {
          ...gallery,
          preview_url: previewUrl,
        }
      })
    )

    // Fetch active photography packages
    const { data: packages } = await supabase
      .from('photography_packages')
      .select('id, name, price_amount, duration_text, includes, sort_order, is_featured')
      .eq('user_id', photographer.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Resolve R2 paths to signed URLs (only if not already a full URL)
    const photographerWithUrls = {
      ...photographer,
      hero_desktop_url: photographer.hero_desktop_url?.startsWith('http')
        ? photographer.hero_desktop_url
        : photographer.hero_desktop_url ? await resolveMediaUrl('branding', photographer.hero_desktop_url) : null,
      hero_mobile_url: photographer.hero_mobile_url?.startsWith('http')
        ? photographer.hero_mobile_url
        : photographer.hero_mobile_url ? await resolveMediaUrl('branding', photographer.hero_mobile_url) : null,
      about_image_url: photographer.about_image_url?.startsWith('http')
        ? photographer.about_image_url
        : photographer.about_image_url ? await resolveMediaUrl('branding', photographer.about_image_url) : null,
      logo_url: photographer.logo_url?.startsWith('http')
        ? photographer.logo_url
        : photographer.logo_url ? await resolveMediaUrl('branding', photographer.logo_url) : null,
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

    console.log('Photographer with resolved URLs:', photographerWithUrls)

    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('message', (event) => {
                if (event.data.type === 'navigate' && event.data.url) {
                  window.location.href = event.data.url;
                }
              });
            `,
          }}
        />
        <PhotographerHomepage
          photographer={photographerWithUrls}
          galleries={galleriesWithSignedUrls}
          packages={packages || []}
        />
      </>
    )
  } catch (error) {
    console.error('Error loading photographer page:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  try {
    const supabase = await createClient()
    const decodedSlug = decodeURIComponent(slug)

    const { data: photographer } = await supabase
      .from('users')
      .select('studio_name, name, about_text')
      .eq('studio_name', decodedSlug)
      .single()

    if (!photographer) {
      return {
        title: 'סטודיו גלריה',
      }
    }

    return {
      title: `${photographer.studio_name || photographer.name} | סטודיו גלריה`,
      description: photographer.about_text || 'סטודיו לצילום מקצועי',
    }
  } catch (error) {
    return {
      title: 'סטודיו גלריה',
    }
  }
}
