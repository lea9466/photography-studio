'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactInquiryEmail } from '@/lib/email/resend'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export async function submitContactInquiry(input: {
  photographerId: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}) {
  const name = input.name.trim()
  const email = input.email.trim()
  const message = input.message.trim()
  const phone = input.phone?.trim() || undefined
  const subject = input.subject?.trim() || undefined

  if (!name) throw new Error('יש למלא שם')
  if (!email) throw new Error('יש למלא אימייל')
  if (!message) throw new Error('יש למלא הודעה')

  const admin = createAdminClient()

  const { data: photographerData, error } = await admin
    .from('users')
    .select('id, email, studio_name, name, slug')
    .eq('id', input.photographerId)
    .single()

  if (error || !photographerData) {
    throw new Error('הצלם לא נמצא')
  }

  const photographer = photographerData as {
    id: string
    email: string | null
    studio_name: string | null
    name: string
    slug: string | null
  }

  if (!photographer.email) {
    throw new Error('לצלם אין כתובת אימייל במערכת')
  }

  const sitePath = getPublicSitePath(photographer.slug, photographer.studio_name)

  await sendContactInquiryEmail({
    photographerEmail: photographer.email,
    photographerName: photographer.studio_name || photographer.name,
    sitePath,
    clientName: name,
    clientEmail: email,
    clientPhone: phone,
    subject,
    message,
  })

  return { success: true }
}
