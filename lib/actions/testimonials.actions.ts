'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createTestimonial(data: {
  title: string
  content: string
  shootType?: string
  reviewDate?: string
  isFeatured?: boolean
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
