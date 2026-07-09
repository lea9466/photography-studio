'use server'

import { revalidatePath } from 'next/cache'
import { getFeedbackEmail } from '@/lib/feedback-email'
import { deleteStudioCompletely } from '@/lib/admin/delete-studio'
import {
  getAdminBroadcastRecipients,
  getAdminStudios,
} from '@/lib/admin/queries'
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
import { sendAdminBroadcastEmail, sendAdminLoginCodeEmail } from '@/lib/email/resend'
import { validatePrimaryImageFile } from '@/lib/media-upload-limits'
import { isR2Configured } from '@/lib/r2/config'
import { createPresignedUploadUrl } from '@/lib/r2/storage'
import { formatTestimonialImageRef } from '@/lib/testimonial-image-url'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

export async function fetchAdminBroadcastRecipientCount() {
  await requireAdmin()
  const recipients = await getAdminBroadcastRecipients()
  return { count: recipients.length }
}

export async function prepareAdminBroadcastImageUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}) {
  await requireAdmin()

  if (!isR2Configured()) {
    throw new Error('אחסון תמונות לא מוגדר')
  }

  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error('סוג הקובץ לא נתמך — JPG, PNG או WebP')
  }
  validatePrimaryImageFile(input.contentType, input.fileSize)

  const extension = input.fileName.split('.').pop() || 'jpg'
  const path = `admin/broadcast_${Date.now()}.${extension}`
  const uploadUrl = await createPresignedUploadUrl('branding', path, input.contentType)

  return {
    uploadUrl,
    storageRef: formatTestimonialImageRef('branding', path),
  }
}

export async function sendAdminBroadcast(input: {
  subject: string
  message: string
  imageUrl?: string | null
}) {
  await requireAdmin()

  const subject = input.subject.trim()
  const message = input.message.trim()
  const imageUrl = input.imageUrl?.trim() || null

  if (!subject) throw new Error('נא להזין נושא למייל')
  if (!message) throw new Error('נא להזין תוכן למייל')

  const recipients = await getAdminBroadcastRecipients()
  if (recipients.length === 0) {
    throw new Error('אין נמענים עם כתובת מייל')
  }

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      await sendAdminBroadcastEmail({
        to: recipient.email,
        recipientName: recipient.name,
        subject,
        message,
        imageUrl,
      })
      sent++
    } catch (error) {
      console.error('[admin broadcast] failed for', recipient.email, error)
      failed++
    }

    if (sent + failed < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return {
    sent,
    failed,
    total: recipients.length,
  }
}
