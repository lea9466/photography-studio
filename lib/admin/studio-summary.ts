import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

type UserScopedTable = Extract<
  keyof Database['public']['Tables'],
  'galleries' | 'clients' | 'photography_packages' | 'posts' | 'testimonials'
>

export type AdminStudioSummary = {
  galleries: number
  publicGalleries: number
  photos: number
  clients: number
  packages: number
  posts: number
  postPhotos: number
  faqItems: number
  testimonials: number
}

async function countExact(
  table: UserScopedTable,
  filter: { column: 'user_id'; value: string }
): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(filter.column, filter.value)
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countPhotosForUser(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { data: galleries, error: galleriesError } = await admin
    .from('galleries')
    .select('id')
    .eq('user_id', userId)

  if (galleriesError) throw new Error(galleriesError.message)

  const galleryIds = (galleries ?? []).map((row) => (row as { id: string }).id)
  if (galleryIds.length === 0) return 0

  const { count, error } = await admin
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .in('gallery_id', galleryIds)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countPostPhotosForUser(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { data: posts, error: postsError } = await admin
    .from('posts')
    .select('id')
    .eq('user_id', userId)

  if (postsError) throw new Error(postsError.message)

  const postIds = (posts ?? []).map((row) => (row as { id: string }).id)
  if (postIds.length === 0) return 0

  const { count, error } = await admin
    .from('post_photos')
    .select('*', { count: 'exact', head: true })
    .in('post_id', postIds)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countFaqItemsForUser(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('faq_items')
    .eq('id', userId)
    .maybeSingle<{ faq_items: unknown }>()

  if (error) throw new Error(error.message)
  return sanitizeFaqItems(parseFaqItems(data?.faq_items)).length
}

async function countPublicGalleries(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getAdminStudioSummary(userId: string): Promise<AdminStudioSummary> {
  const [
    galleries,
    publicGalleries,
    photos,
    clients,
    packages,
    posts,
    postPhotos,
    faqItems,
    testimonials,
  ] = await Promise.all([
    countExact('galleries', { column: 'user_id', value: userId }),
    countPublicGalleries(userId),
    countPhotosForUser(userId),
    countExact('clients', { column: 'user_id', value: userId }),
    countExact('photography_packages', { column: 'user_id', value: userId }),
    countExact('posts', { column: 'user_id', value: userId }),
    countPostPhotosForUser(userId),
    countFaqItemsForUser(userId),
    countExact('testimonials', { column: 'user_id', value: userId }),
  ])

  return {
    galleries,
    publicGalleries,
    photos,
    clients,
    packages,
    posts,
    postPhotos,
    faqItems,
    testimonials,
  }
}
