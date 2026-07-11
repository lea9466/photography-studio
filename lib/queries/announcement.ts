import { getDashboardContext } from '@/lib/auth/dashboard-context'
import { normalizeAnnouncementIcon } from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const context = await getDashboardContext()
  if (!context) return null

  const { data, error } = await context.supabase
    .from('announcements')
    .select('id, title, content, icon, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const row = data as Announcement

  return {
    ...row,
    icon: normalizeAnnouncementIcon(row.icon),
  }
}
