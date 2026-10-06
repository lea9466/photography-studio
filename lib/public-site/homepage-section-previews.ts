import { resolveBrandingPath } from '@/lib/branding-urls'
import { resolveGalleryCoverCardPath } from '@/lib/seo/public-metadata'
import type { requireDashboardContext } from '@/lib/auth/dashboard-context'

/**
 * Just enough of the photographer's own content to make the section
 * thumbnails in the order editor recognisable (about portrait, gallery covers) — deliberately not the full homepage data.
 */
export type SectionPreviewData = {
  accentColor: string
  isDarkTheme: boolean
  aboutImageUrl: string | null
  galleryCovers: string[]
}

type DashboardSupabase = Awaited<ReturnType<typeof requireDashboardContext>>['supabase']

export async function loadSectionPreviewData(
  supabase: DashboardSupabase,
  userId: string
): Promise<SectionPreviewData> {
  const [profileRes, galleriesRes] = await Promise.all([
    supabase
      .from('users')
      .select('accent_color, selected_theme, about_image_url')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('galleries')
      .select('id, cover_image')
      .eq('user_id', userId)
      .eq('is_public', true)
      .not('cover_image', 'is', null)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const profile = profileRes.data as {
    accent_color: string | null
    selected_theme: string | null
    about_image_url: string | null
  } | null

  const galleries = (galleriesRes.data ?? []) as Array<{ id: string; cover_image: string | null }>
  const galleryCovers = (
    await Promise.all(
      galleries.map(async (gallery) => {
        const cover = gallery.cover_image
        if (!cover) return null
        try {
          return cover.startsWith('http') ? cover : await resolveGalleryCoverCardPath(cover, gallery.id)
        } catch {
          return null
        }
      })
    )
  ).filter((url): url is string => Boolean(url))

  let aboutImageUrl: string | null = null
  try {
    aboutImageUrl = await resolveBrandingPath(profile?.about_image_url ?? null)
  } catch {
    aboutImageUrl = null
  }

  const theme = profile?.selected_theme

  return {
    accentColor: profile?.accent_color || '#7D3A52',
    isDarkTheme: theme === 'dark' || theme === 'bold',
    aboutImageUrl,
    galleryCovers,
  }
}
