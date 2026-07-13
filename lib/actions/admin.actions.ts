'use server'

import { revalidatePath } from 'next/cache'
import { getFeedbackEmail } from '@/lib/feedback-email'
import { deleteStudioCompletely } from '@/lib/admin/delete-studio'
import {
  getAdminBroadcastRecipients,
  getAdminStudios,
  getLatestAnnouncementForAdmin,
  type AdminStudioRow,
} from '@/lib/admin/queries'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import { getAdminStudioSummary } from '@/lib/admin/studio-summary'
import {
  isAnnouncementIconKey,
  normalizeAnnouncementIcon,
} from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'
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
import { createAdminClient } from '@/lib/supabase/admin'
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

export type AdminEmailCheckResult = {
  exists: boolean
  studio: AdminStudioRow | null
}

export async function checkStudioEmailExists(email: string): Promise<AdminEmailCheckResult> {
  await requireAdmin()

  const normalized = normalizeEmail(email)
  if (!normalized) {
    throw new Error('נא להזין אימייל')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select(
      'id, email, name, studio_name, slug, created_at, last_dashboard_visit_at, dashboard_visit_count'
    )
    .ilike('email', normalized)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    return { exists: false, studio: null }
  }

  const row = data as {
    id: string
    email: string | null
    name: string | null
    studio_name: string | null
    slug: string | null
    created_at: string
    last_dashboard_visit_at: string | null
    dashboard_visit_count: number
  }

  return {
    exists: true,
    studio: {
      ...row,
      dashboard_visit_count: row.dashboard_visit_count ?? 0,
      site_path: getPublicSitePath(row.slug, row.studio_name),
    },
  }
}

export async function fetchAdminStudioSummary(userId: string) {
  await requireAdmin()

  const trimmedId = userId.trim()
  if (!trimmedId) {
    throw new Error('מזהה סטודיו חסר')
  }

  return getAdminStudioSummary(trimmedId)
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

export async function fetchLatestAnnouncementForAdmin(): Promise<Announcement | null> {
  await requireAdmin()
  return getLatestAnnouncementForAdmin()
}

export async function publishAnnouncement(input: {
  title: string
  content: string
  icon: string
  isActive: boolean
}) {
  await requireAdmin()

  const title = input.title.trim()
  const content = input.content.trim()
  const icon = normalizeAnnouncementIcon(input.icon)
  const isActive = input.isActive

  if (!title) throw new Error('נא להזין כותרת')
  if (!content) throw new Error('נא להזין תוכן')
  if (!isAnnouncementIconKey(icon)) {
    throw new Error('סוג אייקון לא תקין')
  }

  const admin = createAdminClient()

  if (isActive) {
    const { error: deactivateError } = await admin
      .from('announcements')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('is_active', true)

    if (deactivateError) throw new Error(deactivateError.message)
  }

  const { data, error } = await admin
    .from('announcements')
    .insert({
      title,
      content,
      icon,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .select('id, title, content, icon, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'פרסום ההודעה נכשל')
  }

  revalidatePath('/manage')
  revalidatePath('/dashboard')

  return data as Announcement
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
