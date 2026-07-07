import { Resend } from 'resend'

import { randomBytes } from 'node:crypto'
import { getFeedbackEmail } from '@/lib/feedback-email'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured) return configured

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

function appUrl(path: string) {
  const base = getAppBaseUrl()
  if (base.includes('localhost')) {
    console.warn(
      '[email] NEXT_PUBLIC_APP_URL points to localhost — clients cannot open these links. Set it to your public URL (e.g. https://studio-galleries.com).'
    )
  }
  return `${base}${path}`
}

function emailFrom() {
  return (
    process.env.EMAIL_FROM ?? 'Studio Gallery <onboarding@resend.dev>'
  )
}

export async function sendPhotographerPasswordResetEmail(input: {
  email: string
  name: string
  password: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] photographer password reset', input)
    return
  }

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'סיסמה חדשה — Studio Gallery',
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.name},</h2>
        <p>ביקשת לאפס את הסיסמה. הסיסמה החדשה שלך היא:</p>
        <p style="font-size: 1.25rem;"><strong>${input.password}</strong></p>
        <p><a href="${appUrl('/login')}">התחברות למערכת</a></p>
        <p style="color: #666; font-size: 0.9rem;">מומלץ לשנות את הסיסמה אחרי ההתחברות.</p>
      </div>
    `,
  })
}

export async function sendGalleryPasswordEmail(input: {
  galleryId: string
  galleryTitle: string
  clientEmail: string
  clientName: string
  studioName: string
  password: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] gallery password', input)
    return
  }

  await resend.emails.send({
    from: emailFrom(),
    to: input.clientEmail,
    subject: `סיסמת הגלריה: ${input.galleryTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>הסיסמה לגלריה <strong>${input.galleryTitle}</strong> היא:</p>
        <p style="font-size: 1.25rem;"><strong>${input.password}</strong></p>
        <p><a href="${appUrl(`/g/${input.galleryId}`)}">כניסה לגלריה</a></p>
      </div>
    `,
  })
}

export async function sendGalleryInviteEmail(input: {
  galleryId: string
  galleryTitle: string
  clientEmail: string
  clientName: string
  studioName: string
  password: string
  expiresAt?: string | null
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] gallery invite', input)
    return
  }

  const expiry = input.expiresAt
    ? `<p>תוקף הגלריה: ${new Date(input.expiresAt).toLocaleDateString('he-IL')}</p>`
    : ''

  await resend.emails.send({
    from: emailFrom(),
    to: input.clientEmail,
    subject: `${input.studioName} שלחו לך גלריה: ${input.galleryTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>${input.studioName} שלחו לך גלריה חדשה: <strong>${input.galleryTitle}</strong></p>
        <p>סיסמה: <strong>${input.password}</strong></p>
        ${expiry}
        <p><a href="${appUrl(`/g/${input.galleryId}`)}">כניסה לגלריה</a></p>
      </div>
    `,
  })
}

export async function sendSelectionDoneEmail(input: {
  galleryId: string
  galleryTitle: string
  userId: string
  clientName: string
  albumCount: number
  editCount: number
}) {
  const resend = getResend()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('users')
    .select('email, studio_name')
    .eq('id', input.userId)
    .single()

  const profile = user as { email: string | null; studio_name: string | null } | null
  const to = profile?.email
  if (!to) {
    console.info('[email stub] selection done — no photographer email', input)
    return
  }

  if (!resend) {
    console.info('[email stub] selection done', input)
    return
  }

  await resend.emails.send({
    from: emailFrom(),
    to,
    subject: `${input.clientName} סיים/ה לבחור תמונות`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>${input.clientName} סיים/ה לבחור</h2>
        <p>גלריה: ${input.galleryTitle}</p>
        <p>❤️ אלבום: ${input.albumCount} | ✨ עיבוד: ${input.editCount}</p>
        <p><a href="${appUrl(`/dashboard/galleries/${input.galleryId}`)}">צפייה בבחירות</a></p>
      </div>
    `,
  })
}

export async function sendDeliveryReadyEmail(input: {
  galleryId: string
  galleryTitle: string
  clientEmail: string
  clientName: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] delivery ready', input)
    return
  }

  await resend.emails.send({
    from: emailFrom(),
    to: input.clientEmail,
    subject: 'התמונות המעובדות שלך מוכנות!',
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>התמונות המעובדות שלך בגלריה <strong>${input.galleryTitle}</strong> מוכנות!</p>
        <p><a href="${appUrl(`/g/${input.galleryId}`)}">כניסה לגלריה</a></p>
      </div>
    `,
  })
}

export async function sendContactInquiryEmail(input: {
  photographerEmail: string
  photographerName: string
  sitePath: string | null
  clientName: string
  clientEmail: string
  clientPhone?: string
  subject?: string
  message: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] contact inquiry', input)
    return
  }

  const siteLink = input.sitePath
    ? `<p><a href="${appUrl(input.sitePath)}">צפייה באתר שלך</a></p>`
    : ''

  const phoneRow = input.clientPhone
    ? `<p><strong>טלפון:</strong> ${input.clientPhone}</p>`
    : ''
  const subjectRow = input.subject
    ? `<p><strong>נושא:</strong> ${input.subject}</p>`
    : ''

  await resend.emails.send({
    from: emailFrom(),
    to: input.photographerEmail,
    replyTo: input.clientEmail,
    subject: `פנייה חדשה מהאתר שלך — ${input.clientName}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>פנייה חדשה מהאתר של ${input.photographerName}</h2>
        <p><strong>שם:</strong> ${input.clientName}</p>
        <p><strong>אימייל:</strong> ${input.clientEmail}</p>
        ${phoneRow}
        ${subjectRow}
        <p><strong>הודעה:</strong></p>
        <p>${input.message.replace(/\n/g, '<br>')}</p>
        ${siteLink}
      </div>
    `,
  })
}

export async function sendFeedbackEmail(input: {
  type: string
  name: string
  email: string
  message: string
  studio?: string
}) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] feedback', input)
    return
  }

  await resend.emails.send({
    from: emailFrom(),
    to: getFeedbackEmail(),
    subject: `[משוב] ${input.type} — ${input.name}`,
    html: `
      <div dir="rtl">
        <p><strong>${input.name}</strong> (${input.email})</p>
        ${input.studio ? `<p>סטודיו: ${input.studio}</p>` : ''}
        <p>${input.message}</p>
      </div>
    `,
  })
}
