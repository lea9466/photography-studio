'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl, resolveMediaUrl } from '@/lib/r2/storage'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

type BrandingImageType = 'logo' | 'hero_desktop' | 'hero_mobile' | 'about'

function validateBrandingFile(contentType: string, fileSize: number) {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('סוג הקובץ לא נתמך')
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('גודל הקובץ חורג מ-20 MB')
  }
}

function brandingPathForUser(userId: string, type: BrandingImageType, fileName: string) {
  const extension = fileName.split('.').pop()
  return `${userId}/${type}_${Date.now()}.${extension}`
}

type UsersUpdate = Database['public']['Tables']['users']['Update']

// Create a non-typed client for dynamic updates
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

export async function prepareBrandingUpload(input: {
  type: BrandingImageType
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

  validateBrandingFile(input.contentType, input.fileSize)

  const path = brandingPathForUser(user.id, input.type, input.fileName)
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return { uploadUrl, path }
}

export async function finalizeBrandingUpload(type: BrandingImageType, path: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')
  if (!path.startsWith(`${user.id}/`)) {
    throw new Error('נתיב קובץ לא תקין')
  }

  const updateData: Record<string, string> = {}
  if (type === 'logo') updateData.logo_url = path
  if (type === 'hero_desktop') updateData.hero_desktop_url = path
  if (type === 'hero_mobile') updateData.hero_mobile_url = path
  if (type === 'about') updateData.about_image_url = path

  const untypedClient = await createUntypedClient()
  const { error } = await untypedClient
    .from('users')
    .update(updateData)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  const url = await resolveMediaUrl('branding', path)
  return { success: true, url, path }
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
  shouldColorLogo?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('יש להתחבר מחדש')

  const updateData: Record<string, any> = {}

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
  if (data.shouldColorLogo !== undefined) updateData.should_color_logo = data.shouldColorLogo

  const untypedClient = await createUntypedClient()
  const { error } = await untypedClient
    .from('users')
    .update(updateData)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  return { success: true }
}
