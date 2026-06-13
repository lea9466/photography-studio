import 'server-only'

import { getAdminClient } from '@/lib/supabase-admin'

export type CodeAccessResult =
  | { kind: 'client'; clientId: string }
  | { kind: 'admin'; email: string }
  | null

export async function resolveAccessCode(
  code: string,
  photographerId: string
): Promise<CodeAccessResult> {
  const sb = getAdminClient()
  if (!sb) return null

  const cleanCode = code.trim()
  if (!cleanCode) return null

  const studioCode = process.env.STUDIO_ACCESS_CODE?.trim()
  if (studioCode && cleanCode === studioCode) {
    const { data: adminUser } = await sb
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .not('email', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (adminUser?.email) {
      return { kind: 'admin', email: adminUser.email.trim() }
    }
  }

  const { data: user } = await sb
    .from('users')
    .select('id, email, role, access_code')
    .eq('access_code', cleanCode)
    .maybeSingle()

  if (!user?.access_code || user.access_code.trim() !== cleanCode) return null

  if (user.role === 'admin') {
    const email = user.email?.trim()
    if (!email) return null
    return { kind: 'admin', email }
  }

  if (user.role === 'client') {
    const { data: client } = await sb
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('photographer_id', photographerId)
      .maybeSingle()

    if (!client) return null
    return { kind: 'client', clientId: client.id }
  }

  return null
}
