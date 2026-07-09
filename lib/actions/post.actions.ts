'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteMediaObject } from '@/lib/r2/storage'
import type { Database } from '@/lib/types/database.types'
import { assertPostOwner } from '@/lib/auth/post-owner'

type PostInsert = Database['public']['Tables']['posts']['Insert']
type PostUpdate = Database['public']['Tables']['posts']['Update']

export type PostWithPhotos = Database['public']['Tables']['posts']['Row'] & {
  post_photos: Database['public']['Tables']['post_photos']['Row'][]
}

function revalidatePostSurfaces() {
  revalidatePath('/dashboard/posts')
  revalidatePath('/[slug]', 'page')
  revalidatePath('/[slug]/blog', 'page')
}

export async function getPosts(): Promise<PostWithPhotos[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_photos!post_photos_post_id_fkey(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as PostWithPhotos[]).map((post) => ({
    ...post,
    post_photos: [...post.post_photos].sort((a, b) => a.sort_order - b.sort_order),
  }))
}

export async function getPost(postId: string): Promise<PostWithPhotos | null> {
  const { supabase } = await assertPostOwner(postId)

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_photos!post_photos_post_id_fkey(*)')
    .eq('id', postId)
    .single()

  if (error) throw new Error(error.message)
  const post = data as PostWithPhotos
  return {
    ...post,
    post_photos: [...post.post_photos].sort((a, b) => a.sort_order - b.sort_order),
  }
}

export async function createPost(input: {
  title: string
  subtitle?: string | null
  content: string
  watermarkText?: string | null
  autoApplyWatermark?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const title = input.title.trim()
  const content = input.content.trim()
  if (!title) throw new Error('כותרת נדרשת')
  if (!content) throw new Error('תוכן הפוסט נדרש')

  const payload: PostInsert = {
    user_id: user.id,
    title,
    subtitle: input.subtitle?.trim() || null,
    content,
    watermark_text: input.watermarkText?.trim() || null,
    auto_apply_watermark: input.autoApplyWatermark ?? true,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload as never)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePostSurfaces()
  return { id: (data as { id: string }).id }
}

export async function updatePost(
  postId: string,
  input: {
    title?: string
    subtitle?: string | null
    content?: string
    watermarkText?: string | null
    autoApplyWatermark?: boolean
  }
) {
  const { supabase } = await assertPostOwner(postId)

  const updates: PostUpdate = { updated_at: new Date().toISOString() }

  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) throw new Error('כותרת נדרשת')
    updates.title = title
  }

  if (input.subtitle !== undefined) {
    updates.subtitle = input.subtitle?.trim() || null
  }

  if (input.content !== undefined) {
    const content = input.content.trim()
    if (!content) throw new Error('תוכן הפוסט נדרש')
    updates.content = content
  }

  if (input.watermarkText !== undefined) {
    updates.watermark_text = input.watermarkText?.trim() || null
  }

  if (input.autoApplyWatermark !== undefined) {
    updates.auto_apply_watermark = input.autoApplyWatermark
  }

  const { error } = await supabase
    .from('posts')
    .update(updates as never)
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePostSurfaces()
}

export async function setPostCoverPhoto(postId: string, photoId: string | null) {
  const { supabase } = await assertPostOwner(postId)

  if (photoId) {
    const { data: photo } = await supabase
      .from('post_photos')
      .select('id')
      .eq('id', photoId)
      .eq('post_id', postId)
      .maybeSingle()

    if (!photo) throw new Error('התמונה לא שייכת לפוסט')
  }

  const { error } = await supabase
    .from('posts')
    .update({ cover_photo_id: photoId, updated_at: new Date().toISOString() } as never)
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePostSurfaces()
}

export async function updatePostsPageTitle(input: {
  title?: string
}): Promise<{ posts_page_title: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const title = input.title?.trim() || null

  const { data, error } = await supabase
    .from('users')
    .update({ posts_page_title: title } as never)
    .eq('id', user.id)
    .select('posts_page_title')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/posts')
  revalidatePath('/[slug]', 'page')
  revalidatePath('/[slug]/blog', 'page')

  return data as { posts_page_title: string | null }
}

export async function deletePost(postId: string) {
  const { supabase } = await assertPostOwner(postId)

  const { data: photos, error: photosError } = await supabase
    .from('post_photos')
    .select('original_url, preview_url, watermarked_preview_url')
    .eq('post_id', postId)

  if (photosError) throw new Error(photosError.message)

  type PhotoRow = {
    original_url: string | null
    preview_url: string | null
    watermarked_preview_url: string | null
  }

  for (const photo of (photos ?? []) as PhotoRow[]) {
    const removals = [
      { bucket: 'originals' as const, path: photo.original_url },
      { bucket: 'previews' as const, path: photo.preview_url },
      { bucket: 'watermarked' as const, path: photo.watermarked_preview_url },
    ].filter((entry) => entry.path)

    for (const { bucket, path } of removals) {
      await deleteMediaObject(bucket, path!)
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw new Error(error.message)

  revalidatePostSurfaces()
}
