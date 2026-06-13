import 'server-only'

import { fetchPhotographerByAuthUserId, getAuthUser } from '@/lib/auth-helpers'
import { getAdminClient } from '@/lib/supabase-admin'

/**
 * מזהה צלם לפי אלבום — נשלף בשרת מ-Supabase, לא מהדפדפן.
 */
export async function resolvePhotographerIdForAlbum(
  albumId: string
): Promise<{ photographerId: string | null; error: string | null }> {
  const sb = getAdminClient()
  if (!sb) {
    return { photographerId: null, error: 'אין חיבור מנהל' }
  }

  const clean = albumId.trim()
  if (!clean) {
    return { photographerId: null, error: 'חסר מזהה גלריה' }
  }

  const { data, error } = await sb
    .from('albums')
    .select('photographer_id')
    .eq('id', clean)
    .maybeSingle()

  if (error) {
    return { photographerId: null, error: error.message }
  }
  if (!data?.photographer_id) {
    return { photographerId: null, error: 'גלריה לא נמצאה או ללא צלם משויך' }
  }

  return { photographerId: data.photographer_id, error: null }
}

/** צלם של המשתמש המחובר, או ברירת מחדל (תאימות לאחור). */
export async function adminResolvePhotographerId(): Promise<string | null> {
  const user = await getAuthUser()
  if (user) {
    const photographer = await fetchPhotographerByAuthUserId(user.id)
    if (photographer) return photographer.id
  }
  return adminDefaultPhotographerId()
}

/** צלם ברירת מחדל (סביבת מנהל יחיד) — ליצירת רשומות חדשות. */
export async function adminDefaultPhotographerId(): Promise<string | null> {
  const sb = getAdminClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('photographers')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('adminDefaultPhotographerId:', error.message)
    return null
  }

  return data?.id ?? null
}
