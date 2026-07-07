import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type AdminStudioRow = {
  id: string
  email: string | null
  name: string | null
  studio_name: string | null
  slug: string | null
  created_at: string
  site_path: string | null
}

export async function getAdminStudios(): Promise<AdminStudioRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, studio_name, slug, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    const message = error.message.includes('fetch failed')
      ? 'לא ניתן להתחבר ל-Supabase. בדקי חיבור לאינטרנט ונסי שוב.'
      : error.message
    throw new Error(message)
  }

  return (data ?? []).map((row) => {
    const studio = row as {
      id: string
      email: string | null
      name: string | null
      studio_name: string | null
      slug: string | null
      created_at: string
    }

    return {
      ...studio,
      site_path: getPublicSitePath(studio.slug, studio.studio_name),
    }
  })
}
