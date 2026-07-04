import { createAdminClient } from '@/lib/supabase/admin'
import { findPhotographerBySlug } from '@/lib/queries/public-photographer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = createAdminClient()
    const { slug } = await params
    const photographer = await findPhotographerBySlug(decodeURIComponent(slug))

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found', slug },
        { status: 404 }
      )
    }

    const typedPhotographer = photographer as any

    const { data: galleries } = await admin
      .from('galleries')
      .select('id, title, slug, created_at')
      .eq('user_id', typedPhotographer.id)
      .eq('gallery_type', 'portfolio')
      .order('created_at', { ascending: false })

    const galleriesWithPhotos = await Promise.all(
      (galleries || []).map(async (gallery: any) => {
        const { data: firstPhoto } = await admin
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

    const { data: packages } = await admin
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
