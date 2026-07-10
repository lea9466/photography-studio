import { requireDashboardContext } from '@/lib/auth/dashboard-context'

export async function assertPostOwner(postId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('user_id', userId)
    .single()

  if (!post) throw new Error('פוסט לא נמצא')

  return { supabase, user: { id: userId }, post: post as { id: string } }
}

type OwnedPostPhotoRow = {
  id: string
  post_id: string
  original_url: string | null
  preview_url: string | null
  watermarked_preview_url: string | null
}

export async function assertPostPhotoInOwnedPost(photoId: string) {
  const { userId, supabase } = await requireDashboardContext()

  const { data: photo } = await supabase
    .from('post_photos')
    .select('id, post_id, original_url, preview_url, watermarked_preview_url')
    .eq('id', photoId)
    .single()

  const row = photo as OwnedPostPhotoRow | null
  if (!row) throw new Error('תמונה לא נמצאה')

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', row.post_id)
    .eq('user_id', userId)
    .single()

  if (!post) throw new Error('פוסט לא נמצאה')

  return { supabase, user: { id: userId }, photo: row }
}
