import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

// Revalidate the sitemap once per hour so newly published studios get discovered.
export const revalidate = 3600

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://studio-galleries.com').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    const admin = createAdminClient()

    // Only fetch what the sitemap needs. We include studio_name so studios that
    // don't have an explicit slug can still be linked via their name.
    const { data: photographers, error } = await admin
      .from('users')
      .select('slug, studio_name, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[sitemap] failed to load photographers:', error.message)
      return staticRoutes
    }

    const photographerRoutes: MetadataRoute.Sitemap = (photographers ?? []).flatMap(
      (photographer) => {
        const path = getPublicSitePath(photographer.slug, photographer.studio_name)
        if (!path) return []

        return [
          {
            url: `${BASE_URL}${path}`,
            lastModified: photographer.created_at ? new Date(photographer.created_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          },
        ]
      }
    )

    return [...staticRoutes, ...photographerRoutes]
  } catch (error) {
    console.error('[sitemap] unexpected error:', error)
    return staticRoutes
  }
}
