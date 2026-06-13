import 'server-only'

export {
  getPlatformAdminSession,
  isPlatformAdminEmail,
  PLATFORM_ADMIN_ROLE,
} from '@/lib/auth-helpers'

import { getAdminClient } from '@/lib/supabase-admin'

/** האם קיים לפחות מנהל פלטפורמה אחד ב-DB (role = platform_admin). */
export async function isPlatformAdminConfigured(): Promise<boolean> {
  const sb = getAdminClient()
  if (!sb) return false

  const { count, error } = await sb
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'platform_admin')

  if (error) {
    console.error('isPlatformAdminConfigured:', error.message)
    return false
  }

  return (count ?? 0) > 0
}
