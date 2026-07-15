import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildPhotographerDiscoverySitemapEntries,
  fetchAllDiscoveryGalleries,
  fetchAllDiscoveryPosts,
  type DiscoveryGallery,
  type DiscoveryPost,
} from '@/lib/seo/photographer-discovery'
import { validateStudioPathLive } from '@/lib/seo/sitemap-validation'

// Revalidate the sitemap once per hour so newly published studios get discovered.
export const revalidate = 3600

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://studio-galleries.com').replace(/\/$/, '')

function groupByUserId<T extends { user_id: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const existing = grouped.get(item.user_id) ?? []
    existing.push(item)
    grouped.set(item.user_id, existing)
  }
  return grouped
}

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

    const [{ data: photographers, error }, allGalleries, allPosts] = await Promise.all([
      admin
        .from('users')
        .select('id, slug, studio_name, gallery_layout_mode, created_at')
        .order('created_at', { ascending: false }),
      fetchAllDiscoveryGalleries(),
      fetchAllDiscoveryPosts(),
    ])

    if (error) {
      console.error('[sitemap] failed to load photographers:', error.message)
      return staticRoutes
    }

    const galleriesByUser = groupByUserId(allGalleries)
    const postsByUser = groupByUserId(allPosts)

    const validatedPhotographers = await Promise.all(
      (photographers ?? []).map(async (photographer) => {
        const studioPath = await validateStudioPathLive(photographer)
        return studioPath ? { photographer, studioPath } : null
      })
    )

    const photographerRoutes: MetadataRoute.Sitemap = validatedPhotographers.flatMap(
      (entry) => {
        if (!entry) return []

        const { photographer } = entry

        const userGalleries = (galleriesByUser.get(photographer.id) ?? []).map(
          (gallery): DiscoveryGallery => ({
            id: gallery.id,
            title: gallery.title,
            slug: gallery.slug,
            gallery_type: gallery.gallery_type,
            is_public: gallery.is_public,
            created_at: gallery.created_at,
          })
        )

        const userPosts = (postsByUser.get(photographer.id) ?? []).map(
          (post): DiscoveryPost => ({
            id: post.id,
            title: '',
            subtitle: null,
            content: '',
            created_at: post.created_at,
          })
        )

        return buildPhotographerDiscoverySitemapEntries({
          photographer: {
            id: photographer.id,
            slug: photographer.slug,
            studio_name: photographer.studio_name,
            gallery_layout_mode: photographer.gallery_layout_mode,
            created_at: photographer.created_at,
          },
          galleries: userGalleries,
          posts: userPosts,
        }).map((entry) => ({
          url: `${BASE_URL}${entry.path}`,
          lastModified: entry.lastModified,
          changeFrequency: entry.changeFrequency,
          priority: entry.priority,
        }))
      }
    )

    const seenUrls = new Set<string>()
    const dedupedPhotographerRoutes = photographerRoutes.filter((entry) => {
      if (seenUrls.has(entry.url)) return false
      seenUrls.add(entry.url)
      return true
    })

    return [...staticRoutes, ...dedupedPhotographerRoutes]
  } catch (error) {
    console.error('[sitemap] unexpected error:', error)
    return staticRoutes
  }
}
