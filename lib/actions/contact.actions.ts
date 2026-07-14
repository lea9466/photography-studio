'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactInquiryEmail } from '@/lib/email/resend'
import { getPublicSitePath } from '@/lib/queries/public-photographer'
import { isValidEmail } from '@/lib/validation'
import { checkPersistentRateLimit, getClientIp } from '@/lib/rate-limit/persistent'

// Public, unauthenticated form (visible to every visitor of every
// photographer's site) that triggers a real outbound email — caps below
// exist purely to stop a single submission from carrying an unbounded
// payload into the email/DB layer. None of these fields have any existing
// client-side maxlength today, so these are the first limits enforced
// anywhere for this form.
const MAX_NAME_LENGTH = 200
const MAX_EMAIL_LENGTH = 254 // RFC 5321 max mailbox length
const MAX_PHONE_LENGTH = 30
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

// Two independent windows: IP-based stops a single abusive client from
// hammering the endpoint at all; photographer-based stops that same client
// (or many different ones, e.g. a botnet) from flooding one specific
// photographer's inbox even while staying under the per-IP limit.
const IP_RATE_LIMIT = { max: 5, windowSeconds: 10 * 60 }
const PHOTOGRAPHER_RATE_LIMIT = { max: 20, windowSeconds: 60 * 60 }

export async function submitContactInquiry(input: {
  photographerId: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}) {
  const name = input.name.trim().slice(0, MAX_NAME_LENGTH)
  const email = input.email.trim().slice(0, MAX_EMAIL_LENGTH)
  const message = input.message.trim().slice(0, MAX_MESSAGE_LENGTH)
  const phone = input.phone?.trim().slice(0, MAX_PHONE_LENGTH) || undefined
  const subject = input.subject?.trim().slice(0, MAX_SUBJECT_LENGTH) || undefined

  if (!name) throw new Error('יש למלא שם')
  if (!email) throw new Error('יש למלא אימייל')
  if (!message) throw new Error('יש למלא הודעה')
  if (!isValidEmail(email)) throw new Error('כתובת אימייל לא תקינה')

  const ip = await getClientIp()
  const ipRate = await checkPersistentRateLimit(
    `contact-inquiry:ip:${ip}`,
    IP_RATE_LIMIT.max,
    IP_RATE_LIMIT.windowSeconds
  )
  if (!ipRate.allowed) {
    const minutes = Math.max(1, Math.ceil(ipRate.retryAfterSeconds / 60))
    throw new Error(`יותר מדי פניות. נסי שוב בעוד ${minutes} דקות.`)
  }

  const photographerRate = await checkPersistentRateLimit(
    `contact-inquiry:photographer:${input.photographerId}`,
    PHOTOGRAPHER_RATE_LIMIT.max,
    PHOTOGRAPHER_RATE_LIMIT.windowSeconds
  )
  if (!photographerRate.allowed) {
    const minutes = Math.max(1, Math.ceil(photographerRate.retryAfterSeconds / 60))
    throw new Error(`יותר מדי פניות. נסי שוב בעוד ${minutes} דקות.`)
  }

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
