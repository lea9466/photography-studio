'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadMediaObject, resolveMediaUrl } from '@/lib/r2/storage'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'

export async function uploadBrandingImage(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const file = formData.get('file') as File
  const type = formData.get('type') as 'logo' | 'hero_desktop' | 'hero_mobile' | 'about'

  if (!file) throw new Error('לא נבחר קובץ')
  if (!type) throw new Error('סוג הקובץ לא צוין')

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('סוג הקובץ לא נתמך')
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('גודל הקובץ חורג מהמקסימום (10MB)')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const filename = `${type}_${timestamp}.${extension}`
  const path = `${user.id}/${filename}`

  // Upload to R2
  const bytes = await file.arrayBuffer()
  await uploadMediaObject('branding', path, new Uint8Array(bytes), file.type)

  // Get the public URL
  const url = await resolveMediaUrl('branding', path)

  // Update user profile with the new image URL
  const updateData: Record<string, string> = {}
  if (type === 'logo') updateData.logo_url = path
  if (type === 'hero_desktop') updateData.hero_desktop_url = path
  if (type === 'hero_mobile') updateData.hero_mobile_url = path
  if (type === 'about') updateData.about_image_url = path

  const { error } = await supabase
    .from('users')
    .update(updateData as never)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  return { success: true, url }
}
