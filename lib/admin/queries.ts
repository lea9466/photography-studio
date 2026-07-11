import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type AdminStudioRow = {
  id: string
  email: string | null
  name: string | null
  studio_name: string | null
  slug: string | null
  created_at: string
  last_dashboard_login_at: string | null
  dashboard_login_count: number
  site_path: string | null
}

export type AdminBroadcastRecipient = {
  email: string
  name: string | null
}

export async function getAdminBroadcastRecipients(): Promise<AdminBroadcastRecipient[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('email, name, studio_name')
    .not('email', 'is', null)

  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  const recipients: AdminBroadcastRecipient[] = []

  for (const row of data ?? []) {
    const user = row as {
      email: string | null
      name: string | null
      studio_name: string | null
    }
    const email = user.email?.trim().toLowerCase()
    if (!email || seen.has(email)) continue

    seen.add(email)
    recipients.push({
      email,
      name: user.studio_name?.trim() || user.name?.trim() || null,
    })
  }

  return recipients
}

export async function getAdminStudios(): Promise<AdminStudioRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select(
      'id, email, name, studio_name, slug, created_at, last_dashboard_login_at, dashboard_login_count'
    )
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
      last_dashboard_login_at: string | null
      dashboard_login_count: number
    }

    return {
      ...studio,
      dashboard_login_count: studio.dashboard_login_count ?? 0,
      site_path: getPublicSitePath(studio.slug, studio.studio_name),
    }
  })
}
