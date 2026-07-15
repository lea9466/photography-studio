import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import {
  resolveActiveStudioPath,
  resolveValidatedBlogPath,
  resolveValidatedGalleryPath,
  resolveValidatedPortfolioPath,
  resolveValidatedPostPath,
  type ValidatableGallery,
  type ValidatablePhotographer,
} from '@/lib/seo/sitemap-validation'

export type DiscoveryGallery = ValidatableGallery & {
  title: string
  created_at: string | null
}

export type DiscoveryPost = {
  id: string
  title: string
  subtitle: string | null
  content: string
  created_at: string
}

export type PhotographerDiscoveryRecord = ValidatablePhotographer & {
  created_at: string | null
}

/** Returns a validated gallery URL, or null when the gallery is not publicly accessible. */
export function buildPublicGalleryCanonicalPath(
  gallery: Pick<DiscoveryGallery, 'id' | 'slug' | 'gallery_type' | 'is_public'>
): string | null {
  return resolveValidatedGalleryPath(gallery)
}

export function buildPostCanonicalPath(studioPath: string, postId: string): string {
  return resolveValidatedPostPath(studioPath, postId) ?? `${studioPath}/blog/${postId}`
}

export function buildSeoMapPath(studioPath: string): string {
  return `${studioPath}/seo-map`
}

export function buildPostDescription(
  post: Pick<DiscoveryPost, 'subtitle' | 'content'>,
  maxLength = 160
): string {
  const raw = post.subtitle?.trim() || post.content.trim()
  const singleLine = raw.replace(/\s+/g, ' ')
  if (singleLine.length <= maxLength) return singleLine
  return `${singleLine.slice(0, maxLength - 1)}…`
}

export function buildGallerySeoTitle(galleryTitle: string, studioName: string): string {
  return `${galleryTitle} | ${studioName}`
}

export function buildGallerySeoDescription(galleryTitle: string, studioName: string): string {
  return `גלריה ציבורית: ${galleryTitle} — מאת ${studioName}`
}

export function buildPostSeoTitle(postTitle: string, studioName: string): string {
  return `${postTitle} | ${studioName}`
}

export async function fetchPhotographerDiscoveryGalleries(
  userId: string
): Promise<DiscoveryGallery[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('galleries')
    .select('id, title, slug, gallery_type, is_public, created_at')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[photographer-discovery] galleries:', error.message)
    return []
  }

  return (data ?? []) as DiscoveryGallery[]
}

export async function fetchPhotographerDiscoveryPosts(userId: string): Promise<DiscoveryPost[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('posts')
    .select('id, title, subtitle, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[photographer-discovery] posts:', error.message)
    return []
  }

  return (data ?? []) as DiscoveryPost[]
}

export async function fetchPhotographerPostById(
  userId: string,
  postId: string
): Promise<DiscoveryPost | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('posts')
    .select('id, title, subtitle, content, created_at')
    .eq('user_id', userId)
    .eq('id', postId)
    .maybeSingle()

  if (error) {
    console.error('[photographer-discovery] post:', error.message)
    return null
  }

  return (data as DiscoveryPost | null) ?? null
}

type SitemapUrlEntry = {
  path: string
  lastModified: Date
  priority: number
  changeFrequency: 'weekly' | 'monthly'
}

export function buildPhotographerDiscoverySitemapEntries(input: {
  photographer: PhotographerDiscoveryRecord
  galleries: DiscoveryGallery[]
  posts: DiscoveryPost[]
}): SitemapUrlEntry[] {
  const studioPath = resolveActiveStudioPath(input.photographer)
  if (!studioPath) return []

  const baseDate = input.photographer.created_at
    ? new Date(input.photographer.created_at)
    : new Date()

  const entries: SitemapUrlEntry[] = [
    {
      path: studioPath,
      lastModified: baseDate,
      priority: 0.8,
      changeFrequency: 'weekly',
    },
  ]

  for (const gallery of input.galleries) {
    const galleryPath = resolveValidatedGalleryPath(gallery)
    if (!galleryPath) continue

    entries.push({
      path: galleryPath,
      lastModified: gallery.created_at ? new Date(gallery.created_at) : baseDate,
      priority: 0.6,
      changeFrequency: 'monthly',
    })
  }

  const blogPath = resolveValidatedBlogPath(studioPath)
  if (blogPath && input.posts.length > 0) {
    entries.push({
      path: blogPath,
      lastModified: new Date(input.posts[0].created_at),
      priority: 0.7,
      changeFrequency: 'weekly',
    })
  }

  for (const post of input.posts) {
    const postPath = resolveValidatedPostPath(studioPath, post.id)
    if (!postPath) continue

    entries.push({
      path: postPath,
      lastModified: new Date(post.created_at),
      priority: 0.5,
      changeFrequency: 'monthly',
    })
  }

  const portfolioPath = resolveValidatedPortfolioPath(input.photographer, studioPath)
  if (portfolioPath) {
    entries.push({
      path: portfolioPath,
      lastModified: baseDate,
      priority: 0.7,
      changeFrequency: 'weekly',
    })
  }

  return entries
}

export async function fetchAllDiscoveryGalleries(): Promise<
  Array<DiscoveryGallery & { user_id: string }>
> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('galleries')
    .select('id, title, slug, gallery_type, is_public, created_at, user_id')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[photographer-discovery] all galleries:', error.message)
    return []
  }

  return (data ?? []) as Array<DiscoveryGallery & { user_id: string }>
}

export async function fetchAllDiscoveryPosts(): Promise<
  Array<Pick<DiscoveryPost, 'id' | 'created_at'> & { user_id: string }>
> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('posts')
    .select('id, created_at, user_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[photographer-discovery] all posts:', error.message)
    return []
  }

  return (data ?? []) as Array<Pick<DiscoveryPost, 'id' | 'created_at'> & { user_id: string }>
}

/** Re-export for callers that need the canonical studio path string. */
export { getPublicSitePath, resolveActiveStudioPath }
