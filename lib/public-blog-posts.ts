import { createAdminClient } from '@/lib/supabase/admin'
import { signStoragePaths } from '@/lib/storage'
import { formatSiteDate, resolveSiteLanguage, type SiteLanguage } from '@/lib/site-language'
import type { PublicBlogPost, PublicBlogPostNavItem } from '@/lib/public-blog-html'
import { buildPostCanonicalPath } from '@/lib/seo/photographer-discovery'

type PostPhotoRow = {
  id: string
  preview_url: string | null
  watermarked_preview_url: string | null
  sort_order: number
}

type PostRow = {
  id: string
  title: string
  subtitle: string | null
  content: string
  auto_apply_watermark: boolean
  cover_photo_id: string | null
  created_at: string
  post_photos: PostPhotoRow[]
}

function resolvePhotoUrl(
  post: PostRow,
  photo: PostPhotoRow,
  previewUrls: Record<string, string>,
  watermarkedUrls: Record<string, string>
): string | null {
  if (post.auto_apply_watermark) {
    return photo.watermarked_preview_url
      ? watermarkedUrls[photo.watermarked_preview_url] ?? null
      : photo.preview_url
        ? previewUrls[photo.preview_url] ?? null
        : null
  }
  return photo.preview_url ? previewUrls[photo.preview_url] ?? null : null
}

function mapPostRow(
  post: PostRow,
  previewUrls: Record<string, string>,
  watermarkedUrls: Record<string, string>,
  siteLanguage: SiteLanguage
): PublicBlogPost {
  const orderedPhotos = [...post.post_photos].sort((a, b) => a.sort_order - b.sort_order)
  const images = orderedPhotos
    .map((photo) => resolvePhotoUrl(post, photo, previewUrls, watermarkedUrls))
    .filter((url): url is string => Boolean(url))

  const coverPhoto = post.cover_photo_id
    ? orderedPhotos.find((photo) => photo.id === post.cover_photo_id)
    : null
  const coverUrl = coverPhoto ? resolvePhotoUrl(post, coverPhoto, previewUrls, watermarkedUrls) : images[0] ?? null

  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle,
    content: post.content,
    date: formatSiteDate(post.created_at, siteLanguage),
    coverUrl,
    images,
  }
}

async function signPostPhotoUrls(posts: PostRow[]) {
  const previewPaths: string[] = []
  const watermarkedPaths: string[] = []

  for (const post of posts) {
    for (const photo of post.post_photos) {
      if (post.auto_apply_watermark) {
        if (photo.watermarked_preview_url) watermarkedPaths.push(photo.watermarked_preview_url)
      } else if (photo.preview_url) {
        previewPaths.push(photo.preview_url)
      }
    }
  }

  const emptyMap: Record<string, string> = {}
  const [previewUrls, watermarkedUrls] = await Promise.all([
    previewPaths.length ? signStoragePaths('previews', previewPaths) : Promise.resolve(emptyMap),
    watermarkedPaths.length
      ? signStoragePaths('watermarked', watermarkedPaths)
      : Promise.resolve(emptyMap),
  ])

  return { previewUrls, watermarkedUrls }
}

const POST_SELECT =
  'id, title, subtitle, content, auto_apply_watermark, cover_photo_id, created_at, post_photos!post_photos_post_id_fkey(id, preview_url, watermarked_preview_url, sort_order)'

export async function fetchPublicBlogPosts(
  userId: string,
  options?: { limit?: number; siteLanguage?: SiteLanguage | null }
): Promise<PublicBlogPost[]> {
  const admin = createAdminClient()
  const siteLanguage = resolveSiteLanguage(options?.siteLanguage)

  let query = admin
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data } = await query
  const posts = (data ?? []) as PostRow[]
  if (!posts.length) return []

  const { previewUrls, watermarkedUrls } = await signPostPhotoUrls(posts)
  return posts.map((post) => mapPostRow(post, previewUrls, watermarkedUrls, siteLanguage))
}

export async function fetchPublicBlogPostById(
  userId: string,
  postId: string,
  siteLanguage?: SiteLanguage | null
): Promise<PublicBlogPost | null> {
  const admin = createAdminClient()
  const language = resolveSiteLanguage(siteLanguage)

  const { data } = await admin
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .eq('id', postId)
    .maybeSingle()

  if (!data) return null

  const post = data as PostRow
  const { previewUrls, watermarkedUrls } = await signPostPhotoUrls([post])
  return mapPostRow(post, previewUrls, watermarkedUrls, language)
}

export async function fetchBlogPostNavigation(
  userId: string,
  postId: string,
  studioPath: string,
  siteLanguage?: SiteLanguage | null
): Promise<{ prev: PublicBlogPostNavItem | null; next: PublicBlogPostNavItem | null }> {
  const admin = createAdminClient()
  const language = resolveSiteLanguage(siteLanguage)

  const { data } = await admin
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as PostRow[]
  if (!posts.length) return { prev: null, next: null }

  const { previewUrls, watermarkedUrls } = await signPostPhotoUrls(posts)
  const mapped = posts.map((post) => mapPostRow(post, previewUrls, watermarkedUrls, language))

  const index = mapped.findIndex((post) => post.id === postId)
  if (index === -1) return { prev: null, next: null }

  const toNavItem = (post: PublicBlogPost): PublicBlogPostNavItem => ({
    id: post.id,
    title: post.title,
    coverUrl: post.coverUrl,
    postPath: buildPostCanonicalPath(studioPath, post.id),
  })

  return {
    prev: index > 0 ? toNavItem(mapped[index - 1]) : null,
    next: index < mapped.length - 1 ? toNavItem(mapped[index + 1]) : null,
  }
}
