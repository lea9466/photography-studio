'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { resolveBrandingPath } from '@/lib/branding-urls'

export interface PublicStudio {
  id: string
  studio_name: string | null
  name: string | null
  logo_url: string | null
  slug: string | null
  theme_primary: string
  accent_color: string
}

const DEMO_STUDIO_SLUG = 'lea-studio'

export async function getPublicStudios(): Promise<PublicStudio[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, studio_name, name, logo_url, slug, theme_primary, accent_color')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getPublicStudios] Error fetching studios:', error)
    return []
  }

  const studios = (data as PublicStudio[]) || []
  
  // Filter to only show users with either studio_name or name
  const filteredStudios = studios.filter(
    s => (s.studio_name && s.studio_name.trim() !== '') || (s.name && s.name.trim() !== '')
  )
  
  // Resolve logo URLs to actual storage URLs
  const studiosWithResolvedLogos = await Promise.all(
    filteredStudios.map(async (studio) => ({
      ...studio,
      logo_url: await resolveBrandingPath(studio.logo_url)
    }))
  )
  
  // Move demo studio to the beginning
  const demoStudio = studiosWithResolvedLogos.find(s => s.slug === DEMO_STUDIO_SLUG)
  const otherStudios = studiosWithResolvedLogos.filter(s => s.slug !== DEMO_STUDIO_SLUG)
  
  if (demoStudio) {
    return [demoStudio, ...otherStudios]
  }
  
  return studiosWithResolvedLogos
}
