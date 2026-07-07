'use server'

import { revalidatePath } from 'next/cache'
import { getFeedbackEmail } from '@/lib/feedback-email'
import { deleteStudioCompletely } from '@/lib/admin/delete-studio'
import { getAdminStudios } from '@/lib/admin/queries'
import {
  clearAdminSession,
  clearPendingAdminOtp,
  generateAdminOtpCode,
  isAdminAuthenticated,
  requireAdmin,
  setAdminSession,
  setPendingAdminOtp,
  verifyPendingAdminOtp,
} from '@/lib/admin/session'
import { sendAdminLoginCodeEmail } from '@/lib/email/resend'

export type AdminActionState = {
  error?: string
  success?: string
  step?: 'email' | 'code' | 'authenticated'
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function requestAdminLoginCode(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const email = normalizeEmail(String(formData.get('email') || ''))
  if (!email) {
    return { error: 'נא להזין אימייל', step: 'email' }
  }

  if (email !== normalizeEmail(getFeedbackEmail())) {
    return {
      error: 'אימייל לא מורשה',
      step: 'email',
    }
  }

  const code = generateAdminOtpCode()
  await setPendingAdminOtp(code)
  await sendAdminLoginCodeEmail({ code })

  return {
    success: 'קוד כניסה נשלח למייל. בדקי את תיבת הדואר.',
    step: 'code',
  }
}

export async function verifyAdminLoginCode(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const code = String(formData.get('code') || '').trim()
  if (!/^\d{6}$/.test(code)) {
    return { error: 'קוד לא תקין', step: 'code' }
  }

  const valid = await verifyPendingAdminOtp(code)
  if (!valid) {
    return { error: 'קוד שגוי או שפג תוקפו', step: 'code' }
  }

  await clearPendingAdminOtp()
  await setAdminSession()
  revalidatePath('/manage')

  return { success: 'התחברת בהצלחה', step: 'authenticated' }
}

export async function adminLogout() {
  await clearAdminSession()
  await clearPendingAdminOtp()
  revalidatePath('/manage')
}

export async function fetchAdminStudios() {
  await requireAdmin()
  return getAdminStudios()
}

export async function deleteAdminStudio(userId: string) {
  await requireAdmin()

  await deleteStudioCompletely(userId)

  revalidatePath('/manage')
  revalidatePath('/sitemap.xml')
  return { success: true }
}

export async function getAdminAuthState() {
  return { authenticated: await isAdminAuthenticated() }
}
