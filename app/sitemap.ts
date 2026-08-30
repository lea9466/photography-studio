import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { isKnownAppHost } from '@/lib/domains/custom-domain-lookup'
import {
  buildPhotographerDiscoverySitemapEntries,
  fetchAllDiscoveryGalleries,
  fetchAllDiscoveryPosts,
  fetchPhotographerDiscoveryGalleries,
  fetchPhotographerDiscoveryPosts,
  type DiscoveryGallery,
  type DiscoveryPost,
  type PhotographerDiscoveryRecord,
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

/**
 * A photographer's connected custom domain isn't part of the global sitemap
 * above (its URLs wouldn't even be accepted there — Search Console rejects
 * a sitemap entry whose host doesn't match the sitemap's own host) and gets
 * nothing from it, so it needs its own scoped sitemap, served from itself.
 * Only reached because lib/domains/rewrite.ts's isPassthroughCustomDomainPath
 * lets /sitemap.xml through the tenant-host middleware branch unrewritten —
 * see that file for why this needs the real Host header.
 */
async function buildCustomDomainSitemap(host: string): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  const { data: domainRow } = await admin
    .from('custom_domains')
    .select('user_id')
    .eq('hostname', host)
    .eq('status', 'active')
    .maybeSingle()

  const userId = (domainRow as { user_id: string } | null)?.user_id
  if (!userId) return []

  const { data: photographerRow } = await admin
    .from('users')
    .select('id, slug, studio_name, gallery_layout_mode, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (!photographerRow) return []

  const photographer = photographerRow as PhotographerDiscoveryRecord

  const [galleries, posts] = await Promise.all([
    fetchPhotographerDiscoveryGalleries(photographer.id),
    fetchPhotographerDiscoveryPosts(photographer.id),
  ])

  const entries = buildPhotographerDiscoverySitemapEntries({
    photographer,
    galleries,
    posts,
    studioPathOverride: '',
  })

  const domainBaseUrl = `https://${host}`
  return entries.map((entry) => ({
    url: `${domainBaseUrl}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host')?.split(':')[0]?.toLowerCase() ?? null
  if (host && !isKnownAppHost(host)) {
    return buildCustomDomainSitemap(host)
  }

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
