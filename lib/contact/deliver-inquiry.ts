import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactInquiryEmail } from '@/lib/email/resend'
import { getPublicSitePath } from '@/lib/queries/public-photographer'

export type ContactInquiryFields = {
  photographerId: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

type Photographer = {
  email: string | null
  studio_name: string | null
  name: string | null
  slug: string | null
}

/**
 * Sends the "new inquiry" email to the photographer and, when the inquiry was
 * saved (`inquiryId`), records the outcome on its contact_inquiries row —
 * email_sent_at on success, email_error on failure. Throws on send failure.
 *
 * Shared by the public form (submitContactInquiry) and the /manage resend
 * button. Deliberately NOT in a 'use server' file: it takes ids from the
 * caller, so it must never be callable straight from the browser.
 */
export async function deliverContactInquiry(
  fields: ContactInquiryFields,
  photographer: Photographer,
  inquiryId: string | null
) {
  if (!photographer.email) throw new Error('לצלם אין כתובת אימייל במערכת')

  const admin = createAdminClient()
  let attempts = 0
  if (inquiryId) {
    const { data } = await admin
      .from('contact_inquiries')
      .select('email_attempts')
      .eq('id', inquiryId)
      .maybeSingle()
    attempts = (data?.email_attempts ?? 0) + 1
  }

  try {
    await sendContactInquiryEmail({
      photographerEmail: photographer.email,
      photographerName: photographer.studio_name || photographer.name || 'הסטודיו',
      sitePath: getPublicSitePath(photographer.slug, photographer.studio_name),
      clientName: fields.name,
      clientEmail: fields.email,
      clientPhone: fields.phone,
      subject: fields.subject,
      message: fields.message,
    })
  } catch (error) {
    if (inquiryId) {
      await admin
        .from('contact_inquiries')
        .update({
          email_error: error instanceof Error ? error.message : 'unknown',
          email_attempts: attempts,
        })
        .eq('id', inquiryId)
    }
    throw error
  }

  if (inquiryId) {
    await admin
      .from('contact_inquiries')
      .update({
        email_sent_at: new Date().toISOString(),
        email_error: null,
        email_attempts: attempts,
      })
      .eq('id', inquiryId)
  }
}
