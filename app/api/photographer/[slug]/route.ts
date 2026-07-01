import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    console.log('Fetching photographer with slug:', slug)

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
      .eq('studio_name', slug)
      .single()

    console.log('Photographer query result:', { photographer, error })

    if (error || !photographer) {
      console.log('Photographer not found, returning 404')
      return NextResponse.json(
        { error: 'Photographer not found', slug },
        { status: 404 }
      )
    }

    // Type assertion to fix TypeScript inference
    const typedPhotographer = photographer as any

    // Fetch public portfolio galleries
    const { data: galleries } = await supabase
      .from('galleries')
      .select('id, title, slug, created_at')
      .eq('user_id', typedPhotographer.id)
      .eq('gallery_type', 'portfolio')
      .order('created_at', { ascending: false })

    // Fetch first photo for each gallery
    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        const { data: firstPhoto } = await supabase
          .from('photos')
          .select('preview_url')
          .eq('gallery_id', gallery.id)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle()

        return {
          ...gallery,
          preview_url: (firstPhoto as any)?.preview_url || null,
        }
      })
    )

    // Fetch active photography packages
    const { data: packages } = await supabase
      .from('photography_packages')
      .select('id, name, price_amount, duration_text, includes, sort_order')
      .eq('user_id', typedPhotographer.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      ...typedPhotographer,
      galleries: galleriesWithPhotos,
      packages: packages || [],
    })
  } catch (error) {
    console.error('Error fetching photographer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
