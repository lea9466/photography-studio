'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import {
  formatTestimonialImageRef,
  getTestimonialImagePreviewUrl,
} from '@/lib/testimonial-image-url'
import { PRIMARY_IMAGE_MAX_BYTES, validatePrimaryImageFile } from '@/lib/media-upload-limits'
import type { Database } from '@/lib/types/database.types'

// Create a non-typed client for dynamic operations
async function createUntypedClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll from Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}

export async function getTestimonials() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = PRIMARY_IMAGE_MAX_BYTES

export async function prepareTestimonialImageUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}) {
  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error('סוג הקובץ לא נתמך')
  }
  validatePrimaryImageFile(input.contentType, input.fileSize)

  const extension = input.fileName.split('.').pop() || 'jpg'
  const path = `${user.id}/testimonials_${Date.now()}.${extension}`
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return {
    uploadUrl,
    storageRef: formatTestimonialImageRef('branding', path),
  }
}

export type TestimonialPhotoOption = {
  id: string
  galleryTitle: string
  storageRef: string
  previewUrl: string
}

export async function getTestimonialPhotoOptions(): Promise<TestimonialPhotoOption[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const untypedClient = await createUntypedClient()
  const { data: galleries, error: galleriesError } = await untypedClient
    .from('galleries')
    .select('id, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (galleriesError) throw new Error(galleriesError.message)

  const options: TestimonialPhotoOption[] = []

  for (const gallery of galleries || []) {
    const { data: photos, error: photosError } = await untypedClient
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', gallery.id)
      .not('preview_url', 'is', null)
      .order('sort_order', { ascending: true })
      .limit(60)

    if (photosError) throw new Error(photosError.message)

    for (const photo of photos || []) {
      if (!photo.preview_url) continue
      const storageRef = formatTestimonialImageRef('previews', photo.preview_url)
      options.push({
        id: photo.id,
        galleryTitle: gallery.title,
        storageRef,
        previewUrl: getTestimonialImagePreviewUrl(storageRef) || '',
      })
    }
  }

  return options
}

export async function createTestimonial(data: {
  title: string
  content: string
  shootType?: string
  reviewDate?: string
  isFeatured?: boolean
  imageUrl?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const untypedClient = await createUntypedClient()
  const { error } = await untypedClient.from('testimonials').insert({
    user_id: user.id,
    title: data.title,
    content: data.content,
    shoot_type: data.shootType || null,
    review_date: data.reviewDate || null,
    is_featured: data.isFeatured || false,
    image_url: data.imageUrl || null,
  })

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function updateTestimonial(id: string, data: {
  title?: string
  content?: string
  shootType?: string
  reviewDate?: string
  isFeatured?: boolean
  sortOrder?: number
  imageUrl?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const updateData: Record<string, any> = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.shootType !== undefined) updateData.shoot_type = data.shootType || null
  if (data.reviewDate !== undefined) updateData.review_date = data.reviewDate || null
  if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl || null

  const untypedClient = await createUntypedClient()
  const { error } = await untypedClient
    .from('testimonials')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  return { success: true }
}

export async function reorderTestimonials(testimonials: { id: string; sortOrder: number }[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const untypedClient = await createUntypedClient()

  // Update each testimonial's sort order
  for (const testimonial of testimonials) {
    const { error } = await untypedClient
      .from('testimonials')
      .update({ sort_order: testimonial.sortOrder })
      .eq('id', testimonial.id)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  }

  return { success: true }
}

export async function updateTestimonialsSectionTitle(input: {
  title?: string
}): Promise<{ testimonials_title: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  if (input.title === undefined) {
    throw new Error('אין שינויים לשמירה')
  }

  const payload: Database['public']['Tables']['users']['Update'] = {
    testimonials_title: input.title.trim() || null,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', user.id)
    .select('testimonials_title')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/reviews')
  revalidatePath('/portfolio')
  revalidatePath('/[slug]', 'page')

  return data as { testimonials_title: string | null }
}

// Public function to get testimonials for a specific photographer (by their slug or user_id)
export async function getPublicTestimonials(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('user_id', userId)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('review_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}
