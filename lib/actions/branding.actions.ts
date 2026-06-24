'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadMediaObject, resolveMediaUrl } from '@/lib/r2/storage'
import { r2ObjectKey } from '@/lib/r2/keys'
import type { MediaBucket } from '@/lib/r2/types'
import type { Database } from '@/lib/types/database.types'

type UsersUpdate = Database['public']['Tables']['users']['Update']

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

  // No file size limit for branding images

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

export async function updateBrandingSettings(data: {
  studioName?: string
  aboutText?: string
  statProjects?: number
  statClients?: number
  statExperienceYears?: number
  accentColor?: string
  selectedTheme?: string
  heroDesktopUrl?: string
  heroMobileUrl?: string
  aboutImageUrl?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const updateData: any = {}

  if (data.studioName !== undefined) updateData.studio_name = data.studioName
  if (data.aboutText !== undefined) updateData.about_text = data.aboutText
  if (data.statProjects !== undefined) updateData.stat_projects = data.statProjects
  if (data.statClients !== undefined) updateData.stat_clients = data.statClients
  if (data.statExperienceYears !== undefined) updateData.stat_experience_years = data.statExperienceYears
  if (data.accentColor !== undefined) updateData.accent_color = data.accentColor
  if (data.selectedTheme !== undefined) updateData.selected_theme = data.selectedTheme
  if (data.heroDesktopUrl !== undefined) updateData.hero_desktop_url = data.heroDesktopUrl
  if (data.heroMobileUrl !== undefined) updateData.hero_mobile_url = data.heroMobileUrl
  if (data.aboutImageUrl !== undefined) updateData.about_image_url = data.aboutImageUrl

  const { error } = await supabase
    .from('users')
    .update(updateData as any)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  return { success: true }
}
