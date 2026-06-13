'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveAccessCode } from '@/lib/code-access'
import { createClientSession } from '@/lib/client-session'
import { getAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { tenantPath } from '@/lib/tenant-paths'

export type CodeLoginResult = { ok: boolean; message: string }

async function signInAdminByEmail(email: string): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) return false

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) return false

  const supabase = await createSupabaseServerClient()
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  })

  return !otpError
}

export async function headerCodeLoginAction(
  photographerSlug: string,
  photographerId: string,
  _prev: CodeLoginResult,
  formData: FormData
): Promise<CodeLoginResult> {
  if (!getAdminClient()) {
    return { ok: false, message: 'המערכת אינה מוגדרת. פנו לסטודיו.' }
  }

  const code = String(formData.get('code') ?? '').trim()
  if (!code) {
    return { ok: false, message: 'נא להזין קוד גישה' }
  }

  const resolved = await resolveAccessCode(code, photographerId)
  if (!resolved) {
    return { ok: false, message: 'קוד גישה שגוי' }
  }

  if (resolved.kind === 'client') {
    await createClientSession(resolved.clientId)
    revalidatePath(tenantPath(photographerSlug, '/client'))
    redirect(tenantPath(photographerSlug, '/client'))
  }

  const signedIn = await signInAdminByEmail(resolved.email)
  if (!signedIn) {
    return { ok: false, message: 'לא ניתן להתחבר לניהול. נסו שוב.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
