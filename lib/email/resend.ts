import { Resend } from 'resend'

import { getFeedbackEmail } from '@/lib/feedback-email'
import { getTestimonialImagePreviewUrl } from '@/lib/testimonial-image-url'
import { CUSTOM_DOMAIN_ADDON_PRICE_ILS } from '@/lib/domains/custom-domain-addon'
import {
  buildEmailStubLog,
  mustFailWithoutResend,
} from '@/lib/email/stub-log'

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

/**
 * Private galleries are meant to live on their own isolated subdomain (see
 * middleware.ts) — until it's actually configured in DNS/Vercel this env
 * var stays unset and the link falls back to the main app domain exactly
 * as before.
 */
function privateGalleryUrl(galleryId: string) {
  const base = process.env.NEXT_PUBLIC_PRIVATE_GALLERY_URL?.trim().replace(/\/$/, '')
  return `${base || getAppBaseUrl()}/g/${galleryId}`
}

function emailFrom() {
  return (
    process.env.EMAIL_FROM ?? 'Studio Gallery <onboarding@resend.dev>'
  )
}

/* -------------------------------------------------------------------------- */
/*  Branded email shell — "STG" luxe layout                                   */
/* -------------------------------------------------------------------------- */

/** Minimal HTML-entity escaping for user-supplied values interpolated into markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Palette + type mirror the photographer dashboard (see app/globals.css
 * `--dashboard-*`): white surfaces, violet accent, near-black ink, Heebo.
 * Kept in one place so every branded email stays consistent with the app.
 */
const LUXE = {
  ink: '#09090b', //   --dashboard-foreground
  brand: '#7c3aed', //  --dashboard-accent (violet-600)
  brandDeep: '#6d28d9', // violet-700 — gradient depth + links
  accent: '#7c3aed', // hairline rules / eyebrow — same violet
  paper: '#fafafa', //  --dashboard-surface
  card: '#ffffff', //   --dashboard-background
  border: '#e5e5e5', // --dashboard-border
  text: '#27272a',
  muted: '#71717a', //  ~ --dashboard-muted
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Heebo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
} as const

/** Solid violet CTA, matching the dashboard's primary button. */
function luxeButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td align="center" bgcolor="${LUXE.brand}" style="background: ${LUXE.brand}; border-radius: 10px;">
          <a href="${href}" style="display: inline-block; padding: 15px 36px; border: 1px solid ${LUXE.brandDeep}; border-radius: 10px; font-family: ${LUXE.sans}; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; color: #ffffff; text-decoration: none;">${label}</a>
        </td>
      </tr>
    </table>`
}

/** A refined, iconless step list. `items` = [label, description] pairs. */
function luxeList(items: ReadonlyArray<readonly [string, string]>) {
  const rows = items
    .map(
      ([label, desc], i) => `
        <tr>
          <td style="padding: 14px 0; ${i === 0 ? '' : `border-top: 1px solid ${LUXE.border};`} font-family: ${LUXE.sans}; font-size: 15px; line-height: 1.65; color: ${LUXE.text};">
            <span style="color: ${LUXE.accent};">—&nbsp;</span><strong style="color: ${LUXE.ink};">${label}</strong>
            <span style="color: ${LUXE.muted};"> ${desc}</span>
          </td>
        </tr>`
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 4px;">${rows}</table>`
}

/**
 * Wraps body content in the branded STG shell: violet header with the
 * monogram + wordmark, a white content card, and a quiet footer. Built with
 * tables + inline styles for broad email-client support.
 */
function renderLuxeEmail(input: { preheader: string; contentHtml: string }) {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
</head>
<body style="margin: 0; padding: 0; background: ${LUXE.paper};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${input.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${LUXE.paper};">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%;">

          <tr>
            <td align="center" bgcolor="${LUXE.brand}" style="background: ${LUXE.brand}; background: linear-gradient(135deg, ${LUXE.brand} 0%, ${LUXE.brandDeep} 100%); border-radius: 16px 16px 0 0; padding: 44px 24px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" width="66" height="66" style="width: 66px; height: 66px; background: #ffffff; border-radius: 16px; font-family: ${LUXE.serif}; font-size: 21px; font-weight: 700; letter-spacing: 3px; color: ${LUXE.brand};">STG</td>
                </tr>
              </table>
              <div style="margin-top: 20px; font-family: ${LUXE.serif}; font-size: 13px; letter-spacing: 6px; color: #ffffff;">STUDIO&nbsp;GALLERY</div>
              <div style="width: 44px; margin: 16px auto 0; border-top: 1px solid rgba(255, 255, 255, 0.5);"></div>
            </td>
          </tr>

          <tr>
            <td dir="rtl" bgcolor="${LUXE.card}" style="background: ${LUXE.card}; padding: 42px 42px 32px; font-family: ${LUXE.sans};">
              ${input.contentHtml}
            </td>
          </tr>

          <tr>
            <td align="center" bgcolor="${LUXE.card}" style="background: ${LUXE.card}; border-top: 1px solid ${LUXE.border}; border-radius: 0 0 16px 16px; padding: 26px 40px 34px; font-family: ${LUXE.sans};">
              <div style="font-family: ${LUXE.serif}; font-size: 12px; letter-spacing: 4px; color: ${LUXE.muted};">STUDIO GALLERY</div>
              <p style="margin: 10px 0 0; font-size: 12px; line-height: 1.65; color: ${LUXE.muted};">המרחב הדיגיטלי לצלמות — אתר, גלריות ולקוחות במקום אחד.<br />© ${year} Studio Gallery · כל הזכויות שמורות.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Resolve Resend client or handle missing key safely.
 * Production: throws (no secret logging fallback).
 * Development: logs redacted metadata only, returns null.
 */
function requireResendOrSafeStub(input: {
  template: string
  email?: string | null
  resourceId?: string | null
  extra?: Record<string, string | number | boolean | null | undefined>
}): Resend | null {
  const resend = getResend()
  if (resend) return resend

  if (mustFailWithoutResend()) {
    throw new Error('Email provider is not configured (RESEND_API_KEY)')
  }

  console.info('[email stub]', buildEmailStubLog(input))
  return null
}

export async function sendPhotographerPasswordResetEmail(input: {
  email: string
  name: string
  password: string
}) {
  const resend = requireResendOrSafeStub({
    template: 'photographer-password-reset',
    email: input.email,
  })
  if (!resend) return

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
  code: string
}) {
  const resend = requireResendOrSafeStub({
    template: 'gallery-password',
    email: input.clientEmail,
    resourceId: input.galleryId,
  })
  if (!resend) return

  await resend.emails.send({
    from: emailFrom(),
    to: input.clientEmail,
    subject: `קוד הכניסה לגלריה: ${input.galleryTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>קוד הכניסה החד-פעמי לגלריה <strong>${input.galleryTitle}</strong> הוא:</p>
        <p style="font-size: 1.5rem; letter-spacing: 0.25rem;"><strong>${input.code}</strong></p>
        <p>הקוד תקף לכניסה אחת בלבד. אם תצטרכו קוד נוסף, ניתן לבקש קוד חדש מהעמוד עצמו.</p>
        <p><a href="${privateGalleryUrl(input.galleryId)}">כניסה לגלריה</a></p>
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
  const resend = requireResendOrSafeStub({
    template: 'gallery-invite',
    email: input.clientEmail,
    resourceId: input.galleryId,
  })
  if (!resend) return

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
        <p><a href="${privateGalleryUrl(input.galleryId)}">כניסה לגלריה</a></p>
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
    if (mustFailWithoutResend()) {
      throw new Error('Photographer email missing for selection notification')
    }
    console.info(
      '[email stub]',
      buildEmailStubLog({
        template: 'selection-done',
        resourceId: input.galleryId,
        extra: { reason: 'no-photographer-email' },
      })
    )
    return
  }

  const resend = requireResendOrSafeStub({
    template: 'selection-done',
    email: to,
    resourceId: input.galleryId,
  })
  if (!resend) return

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
  const resend = requireResendOrSafeStub({
    template: 'delivery-ready',
    email: input.clientEmail,
    resourceId: input.galleryId,
  })
  if (!resend) return

  await resend.emails.send({
    from: emailFrom(),
    to: input.clientEmail,
    subject: 'התמונות המעובדות שלך מוכנות!',
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>התמונות המעובדות שלך בגלריה <strong>${input.galleryTitle}</strong> מוכנות!</p>
        <p><a href="${privateGalleryUrl(input.galleryId)}">כניסה לגלריה</a></p>
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
  const resend = requireResendOrSafeStub({
    template: 'contact-inquiry',
    email: input.photographerEmail,
  })
  if (!resend) return

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

export async function sendAdminLoginCodeEmail(input: { code: string }) {
  const resend = requireResendOrSafeStub({
    template: 'admin-login-code',
    email: getFeedbackEmail(),
  })
  if (!resend) return

  await resend.emails.send({
    from: emailFrom(),
    to: getFeedbackEmail(),
    subject: 'קוד כניסה — ניהול Studio Galleries',
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>כניסה לדף הניהול</h2>
        <p>קוד הכניסה שלך:</p>
        <p style="font-size: 1.5rem; letter-spacing: 0.2em;"><strong>${input.code}</strong></p>
        <p style="color: #666; font-size: 0.9rem;">הקוד תקף ל-15 דקות.</p>
        <p><a href="${appUrl('/manage')}">מעבר לדף הניהול</a></p>
      </div>
    `,
  })
}

export async function sendAdminBroadcastEmail(input: {
  to: string
  recipientName?: string | null
  subject: string
  message: string
  imageUrl?: string | null
}) {
  const resend = requireResendOrSafeStub({
    template: 'admin-broadcast',
    email: input.to,
  })
  if (!resend) return

  const greeting = input.recipientName ? `שלום ${input.recipientName},` : 'שלום,'
  const bodyHtml = input.message.replace(/\n/g, '<br>')

  const imageHref = input.imageUrl
    ? getTestimonialImagePreviewUrl(input.imageUrl)
      ? appUrl(getTestimonialImagePreviewUrl(input.imageUrl)!)
      : null
    : null
  const imageBlock = imageHref
    ? `
        <p><img src="${imageHref}" alt="" style="max-width: 100%; max-height: 480px; border-radius: 8px; border: 1px solid #ddd; margin-top: 16px;" /></p>
      `
    : ''

  await resend.emails.send({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
        <p>${greeting}</p>
        <p>${bodyHtml}</p>
        ${imageBlock}
        <p style="color: #666; font-size: 0.85rem; margin-top: 24px;">Studio Galleries</p>
      </div>
    `,
  })
}

/**
 * Pure builder for the welcome email (subject / text / html) so the branded
 * layout can be previewed and snapshot-tested without a Resend client.
 */
export function buildWelcomeEmail(input: { name: string }): {
  subject: string
  text: string
  html: string
} {
  const supportEmail = getFeedbackEmail()
  const name = escapeHtml(input.name.trim() || 'שלום')
  const dashboardUrl = appUrl('/dashboard')
  const subscriptionUrl = appUrl('/dashboard/subscription')

  const eyebrow = `margin: 0 0 10px; font-family: ${LUXE.serif}; font-size: 12px; letter-spacing: 3px; color: ${LUXE.brand}; text-transform: uppercase;`
  const h1 = `margin: 0 0 20px; font-family: ${LUXE.serif}; font-size: 25px; line-height: 1.4; font-weight: 400; color: ${LUXE.ink};`
  const p = `margin: 0 0 16px; font-family: ${LUXE.sans}; font-size: 16px; line-height: 1.75; color: ${LUXE.text};`
  const pMuted = `margin: 0 0 16px; font-family: ${LUXE.sans}; font-size: 14px; line-height: 1.7; color: ${LUXE.muted};`
  const link = `color: ${LUXE.brandDeep}; text-decoration: underline;`

  const contentHtml = `
    <p style="${eyebrow}">ברוכה הבאה</p>
    <h1 style="${h1}">הסטודיו הדיגיטלי שלך מוכן</h1>
    <p style="${p}">שלום ${name},</p>
    <p style="${p}">איזה כיף שהצטרפת. החשבון שלך רשום ומוכן, ומכאן אפשר להתחיל לבנות נוכחות מקצועית ומוקפדת — כזו שמכבדת את העבודה שלך.</p>
    <p style="${p}">המערכת נבנתה כדי לאפשר לכל צלמת להקים אתר עסקי מהיר ומדויק, בלי לגעת בקוד. הכול מנוהל מהאזור האישי, וכל שינוי נשמר מיד.</p>
    ${luxeButton(dashboardUrl, 'כניסה לאזור האישי')}
    <p style="${eyebrow} margin-top: 4px;">צעדים ראשונים</p>
    ${luxeList([
      ['העלאת העבודות', 'גלריות מסודרות שמציגות את הצילומים באיכות מלאה ובטעינה מהירה.'],
      ['חבילות ומחירים', 'הצגה ברורה ומזמינה של שירותי הצילום שלך.'],
      ['בלוג אישי', 'הצצות מאחורי הקלעים וטיפים ללקוחות, וגם קידום אורגני בגוגל.'],
      ['עיצוב האתר', 'לוגו, תמונות רקע והתאמה מלאה לקו העסקי שלך.'],
    ])}
    <div style="border-top: 1px solid ${LUXE.accent}; width: 44px; margin: 28px 0;"></div>
    <p style="${p}">רוצה שבוע שימוש במתנה? באזור האישי מחכה לך <a href="${subscriptionUrl}" style="${link}">קישור שיתוף ייחודי</a>. כל צלמת שתפתח סטודיו דרך הקישור שלך מזכה אותך בשבוע פרימיום מלא — והיא מקבלת אתר משלה.</p>
    <p style="${pMuted}">צריכה עזרה בהקמה או רוצה להתייעץ? אני זמינה במייל <a href="mailto:${supportEmail}" style="${link}">${supportEmail}</a>, או דרך טאב יצירת הקשר במערכת.</p>
    <p style="${p} margin-bottom: 0;">בהצלחה!</p>`

  return {
    subject: 'ברוכה הבאה ל‑Studio Gallery — הסטודיו שלך מוכן',
    text: [
      `שלום ${input.name.trim() || ''},`.trim(),
      '',
      'איזה כיף שהצטרפת. החשבון שלך רשום ומוכן, ומכאן אפשר להתחיל לבנות נוכחות מקצועית ומוקפדת שמכבדת את העבודה שלך.',
      '',
      'המערכת נבנתה כדי לאפשר לכל צלמת להקים אתר עסקי מהיר ומדויק, בלי לגעת בקוד. הכול מנוהל מהאזור האישי, וכל שינוי נשמר מיד.',
      '',
      `כניסה לאזור האישי: ${dashboardUrl}`,
      '',
      'צעדים ראשונים:',
      '- העלאת העבודות — גלריות מסודרות שמציגות את הצילומים באיכות מלאה ובטעינה מהירה.',
      '- חבילות ומחירים — הצגה ברורה ומזמינה של שירותי הצילום שלך.',
      '- בלוג אישי — הצצות מאחורי הקלעים וטיפים ללקוחות, וגם קידום אורגני בגוגל.',
      '- עיצוב האתר — לוגו, תמונות רקע והתאמה מלאה לקו העסקי שלך.',
      '',
      `רוצה שבוע שימוש במתנה? באזור האישי מחכה לך קישור שיתוף ייחודי (${subscriptionUrl}). כל צלמת שתפתח סטודיו דרך הקישור שלך מזכה אותך בשבוע פרימיום מלא.`,
      '',
      `צריכה עזרה? אני זמינה במייל ${supportEmail} או דרך טאב יצירת הקשר במערכת.`,
      '',
      'בהצלחה!',
    ].join('\n'),
    html: renderLuxeEmail({
      preheader:
        'החשבון שלך מוכן — אתר, גלריות ולקוחות במקום אחד. הנה כמה צעדים ראשונים.',
      contentHtml,
    }),
  }
}

/**
 * Pure builder for the custom-domain-feature announcement email — same
 * preview/snapshot-testable shape as buildWelcomeEmail. Mirrors the content
 * of /dashboard/custom-domain (CustomDomainExplainer) so the two never say
 * different things about price or process.
 */
export function buildCustomDomainAddonAnnouncementEmail(input: { name: string }): {
  subject: string
  text: string
  html: string
} {
  const name = escapeHtml(input.name.trim() || 'שלום')
  const customDomainUrl = appUrl('/dashboard/custom-domain')
  const contactUrl = appUrl('/dashboard/contact')

  const eyebrow = `margin: 0 0 10px; font-family: ${LUXE.serif}; font-size: 12px; letter-spacing: 3px; color: ${LUXE.brand}; text-transform: uppercase;`
  const h1 = `margin: 0 0 20px; font-family: ${LUXE.serif}; font-size: 25px; line-height: 1.4; font-weight: 400; color: ${LUXE.ink};`
  const p = `margin: 0 0 16px; font-family: ${LUXE.sans}; font-size: 16px; line-height: 1.75; color: ${LUXE.text};`
  const pMuted = `margin: 0 0 16px; font-family: ${LUXE.sans}; font-size: 14px; line-height: 1.7; color: ${LUXE.muted};`
  const link = `color: ${LUXE.brandDeep}; text-decoration: underline;`

  const contentHtml = `
    <p style="${eyebrow}">פיצ'ר חדש</p>
    <h1 style="${h1}">האתר שלך, בכתובת שלך</h1>
    <p style="${p}">שלום ${name},</p>
    <p style="${p}">מעכשיו אפשר לחבר לאתר שלך דומיין אישי — כתובת עצמאית משלך (למשל <span dir="ltr">www.השם-שלך.com</span>) במקום כתובת ה-slug של הפלטפורמה. בדיוק כמו לכל עסק אמיתי.</p>

    <p style="${eyebrow} margin-top: 28px;">למה כדאי</p>
    ${luxeList([
      ['זהות מקצועית וייחודית', 'האתר שלך יופיע בכתובת שלך — הרבה יותר קל לזכור, לשווק ולשים על כרטיס ביקור.'],
      ['עיגול ייחודי בגוגל', 'ה"עיגול" הקטן ליד השם בתוצאות חיפוש (favicon) משותף לכל מי שנמצאת תחת כתובת הפלטפורמה. דומיין אישי נותן לך עיגול משלך.'],
      ['אמון גבוה יותר', 'כתובת אישית משדרת עסק מבוסס ורציני, לא עוד "אתר על פלטפורמה".'],
    ])}

    <p style="${eyebrow} margin-top: 28px;">איך זה עובד</p>
    ${luxeList([
      ['קונים דומיין', 'אצל כל ספק שתרצי — עולה בדרך כלל 50–100 ₪ לשנה.'],
      ['מזינות אותו באזור האישי', 'בטאב "דומיין אישי" — תופענה שם הוראות מדויקות בשבילך.'],
      ['מוכיחות בעלות', 'מוסיפות רשומה אחת אצל ספק הדומיין — לוקח כמה דקות, ועד כמה שעות עד שזה נכנס לתוקף.'],
      ['האתר עולה', 'ברגע שהאימות מסתיים, האתר שלך זמין בכתובת האישית שלך עם אבטחה (SSL) מלאה.'],
    ])}
    <p style="${pMuted}">חשוב לדעת: אחרי שהאתר עולה, לוקח לגוגל בדרך כלל שבועות עד חודשיים לעדכן את תוצאות החיפוש לכתובת החדשה — זה תהליך הדרגתי, לא מיידי.</p>
    <p style="${pMuted}">חשוב לדעת גם: דומיין חדש שקונים לרוב חסום בהתחלה אצל חברות סינון תוכן (כמו נטפרי), פשוט כי הוא עדיין לא מסווג אצלן. אחרי שהאתר עולה, כדאי לנסות לפתוח אותו — אם מופיעה חסימה, שולחות לחברת הסינון בקשה לסיווג/פתיחה. ברוב המקרים זה נפתח תוך יום-יומיים.</p>

    <p style="${eyebrow} margin-top: 28px;">עלות</p>
    <p style="${p}">אם יש לך מנוי פרו בתשלום — הפיצ'ר כלול אצלך בחינם, בלי תוספת. אם את לא רוצה מנוי מלא, אפשר גם לפתוח רק את הדומיין האישי בנפרד, בתוספת חד-פעמית של ${CUSTOM_DOMAIN_ADDON_PRICE_ILS} ₪ — לתמיד, בלי קשר למנוי.</p>

    ${luxeButton(customDomainUrl, 'לחיבור דומיין אישי')}

    <div style="border-top: 1px solid ${LUXE.accent}; width: 44px; margin: 28px 0;"></div>
    <p style="${pMuted}">לא בטוחה שתסתדרי לבד עם ההגדרות הטכניות? כדאי לנסות קודם עם עזרה מ-AI (צילום מסך של עמוד ה-DNS אצל ספק הדומיין, בצ'אט עם ג'מיני או ChatGPT) — ברוב המקרים זה עובד מצוין. עדיין תקועה? אני יכולה ללוות אותך אישית בכל התהליך בעלות חד-פעמית של 89 ₪ — <a href="${contactUrl}" style="${link}">יצירת קשר</a>.</p>
    <p style="${p} margin-bottom: 0;">בהצלחה!</p>`

  return {
    subject: "פיצ'ר חדש: האתר שלך, בכתובת שלך",
    text: [
      `שלום ${input.name.trim() || ''},`.trim(),
      '',
      'מעכשיו אפשר לחבר לאתר שלך דומיין אישי — כתובת עצמאית משלך (למשל www.השם-שלך.com) במקום כתובת ה-slug של הפלטפורמה.',
      '',
      'למה כדאי:',
      '- זהות מקצועית וייחודית — האתר שלך יופיע בכתובת שלך.',
      '- עיגול ייחודי בגוגל — ה-favicon בתוצאות חיפוש הופך להיות שלך, לא של הפלטפורמה.',
      '- אמון גבוה יותר אצל לקוחות.',
      '',
      'איך זה עובד:',
      '1. קונים דומיין (50–100 ₪ לשנה בערך).',
      '2. מזינות אותו באזור האישי, בטאב "דומיין אישי".',
      '3. מוכיחות בעלות — מוסיפות רשומה אחת אצל ספק הדומיין.',
      '4. האתר עולה בכתובת האישית שלך, עם SSL מלא.',
      '',
      'חשוב לדעת: לוקח לגוגל בדרך כלל שבועות עד חודשיים לעדכן את תוצאות החיפוש לכתובת החדשה.',
      '',
      'חשוב לדעת גם: דומיין חדש לרוב חסום בהתחלה אצל חברות סינון תוכן (כמו נטפרי) — כדאי לנסות לפתוח את האתר אחרי שהוא עולה, ואם חסום לשלוח לחברת הסינון בקשה לסיווג. ברוב המקרים זה נפתח תוך יום-יומיים.',
      '',
      `עלות: כלול בחינם במנוי פרו. בלי מנוי — אפשר לפתוח רק את זה בתוספת חד-פעמית של ${CUSTOM_DOMAIN_ADDON_PRICE_ILS} ₪.`,
      '',
      `לחיבור דומיין אישי: ${customDomainUrl}`,
      '',
      `לא בטוחה שתסתדרי לבד? נסי קודם עזרה מ-AI (screenshot + ג'מיני/ChatGPT), ואם עדיין תקועה — ליווי אישי ב-89 ₪ חד-פעמי: ${contactUrl}`,
      '',
      'בהצלחה!',
    ].join('\n'),
    html: renderLuxeEmail({
      preheader: 'עכשיו אפשר לחבר לאתר שלך דומיין אישי — הכתובת שלך, לא כתובת הפלטפורמה.',
      contentHtml,
    }),
  }
}

export async function sendCustomDomainAddonAnnouncementEmail(input: { name: string; email: string }) {
  const resend = requireResendOrSafeStub({
    template: 'custom-domain-addon-announcement',
    email: input.email,
  })
  if (!resend) return

  const { subject, text, html } = buildCustomDomainAddonAnnouncementEmail({ name: input.name })

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    replyTo: getFeedbackEmail(),
    subject,
    text,
    html,
  })
}

export async function sendWelcomeEmail(input: { name: string; email: string }) {
  const resend = requireResendOrSafeStub({
    template: 'welcome',
    email: input.email,
  })
  if (!resend) return

  const { subject, text, html } = buildWelcomeEmail({ name: input.name })

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    replyTo: getFeedbackEmail(),
    subject,
    text,
    html,
  })
}

/**
 * Soft status update while checkout is closed.
 * No payment CTA / checkout link.
 */
export async function sendTrialUpdateEmail(input: {
  name: string
  email: string
  monthlyPrice: string
}): Promise<{ sent: boolean }> {
  const resend = requireResendOrSafeStub({
    template: 'trial-update',
    email: input.email,
  })
  if (!resend) return { sent: false }

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'עדכון קטן לגבי Studio Gallery 💛',
    text: [
      'היי,',
      '',
      'רצינו לעדכן שאנחנו נמצאים בשלבים האחרונים של פתיחת מערכת המנויים.',
      '',
      `בימים הקרובים תיפתח האפשרות להמשיך לשימוש בתוכנית המלאה בעלות של ${input.monthlyPrice} ₪ לחודש.`,
      '',
      'בינתיים אין צורך לעשות שום דבר.',
      '',
      'תקופת הניסיון שלך ממשיכה לפעול כרגיל,',
      'והגישה שלך לא תיחסם לפני שמערכת התשלומים תהיה זמינה.',
      '',
      'ברגע שהאפשרות תיפתח,',
      'נשלח לך מייל נוסף עם קישור ישיר להצטרפות.',
      '',
      'תודה שאת חלק מ-Studio Gallery ❤️',
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p>היי,</p>
        <p>רצינו לעדכן שאנחנו נמצאים בשלבים האחרונים של פתיחת מערכת המנויים.</p>
        <p>בימים הקרובים תיפתח האפשרות להמשיך לשימוש בתוכנית המלאה בעלות של ${input.monthlyPrice} ₪ לחודש.</p>
        <p>בינתיים אין צורך לעשות שום דבר.</p>
        <p>
          תקופת הניסיון שלך ממשיכה לפעול כרגיל,<br />
          והגישה שלך לא תיחסם לפני שמערכת התשלומים תהיה זמינה.
        </p>
        <p>
          ברגע שהאפשרות תיפתח,<br />
          נשלח לך מייל נוסף עם קישור ישיר להצטרפות.
        </p>
        <p>תודה שאת חלק מ-Studio Gallery ❤️</p>
      </div>
    `,
  })

  return { sent: true }
}

/** Payment CTA email — only used when PAYMENTS_CHECKOUT_ENABLED=true. */
export async function sendTrialEndingReminderEmail(input: {
  name: string
  email: string
  monthlyPrice: string
  slug: string | null
}): Promise<{ sent: boolean }> {
  const resend = requireResendOrSafeStub({
    template: 'trial-ending-reminder',
    email: input.email,
  })
  if (!resend) return { sent: false }

  const subscriptionUrl = appUrl('/dashboard/subscription')
  const siteUrl = input.slug ? appUrl(`/${input.slug}`) : null
  const displayName = input.name.trim() || 'שם'

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'תקופת הניסיון שלך עומדת להסתיים',
    text: [
      `היי ${displayName},`,
      '',
      'רצינו להזכיר שתקופת הניסיון שלך ב־Studio Gallery תסתיים בעוד 3 ימים.',
      `כדי להמשיך להשתמש במערכת, אפשר להצטרף למנוי החודשי בעלות של ${input.monthlyPrice} ₪.`,
      '',
      `המשך למנוי: ${subscriptionUrl}`,
      ...(siteUrl ? ['', `לצפייה באתר שלך כרגע: ${siteUrl}`] : []),
      '',
      'האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.',
      '',
      'אם לא תבחרי להמשיך, החשבון לא יחויב אוטומטית.',
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p>היי ${displayName},</p>
        <p>רצינו להזכיר שתקופת הניסיון שלך ב־Studio Gallery תסתיים בעוד 3 ימים.</p>
        <p>כדי להמשיך להשתמש במערכת, אפשר להצטרף למנוי החודשי בעלות של ${input.monthlyPrice} ₪.</p>
        <p style="margin: 24px 0;">
          <a
            href="${subscriptionUrl}"
            style="display: inline-block; background: #7D3A52; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
          >
            המשך למנוי
          </a>
          ${siteUrl
            ? `<a
            href="${siteUrl}"
            style="display: inline-block; margin-inline-start: 10px; color: #7D3A52; text-decoration: underline; padding: 12px 4px; font-weight: 600;"
          >
            צפייה באתר שלך
          </a>`
            : ''}
        </p>
        <p>האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.</p>
        <p>אם לא תבחרי להמשיך, החשבון לא יחויב אוטומטית.</p>
      </div>
    `,
  })

  return { sent: true }
}

/**
 * Day-zero notification: trial just ended, account moved to the FREE plan.
 * `checkoutEnabled` selects whether an upgrade CTA is shown — mirrors the
 * update/payment split in sendTrialUpdateEmail/sendTrialEndingReminderEmail.
 */
export async function sendTrialExpiredEmail(input: {
  name: string
  email: string
  checkoutEnabled: boolean
  slug: string | null
}): Promise<{ sent: boolean }> {
  const resend = requireResendOrSafeStub({
    template: 'trial-expired',
    email: input.email,
  })
  if (!resend) return { sent: false }

  const displayName = input.name.trim() || 'שם'
  const subscriptionUrl = appUrl('/dashboard/subscription')
  const siteUrl = input.slug ? appUrl(`/${input.slug}`) : null

  if (!input.checkoutEnabled) {
    // Payments aren't live yet, so there's no way to pay to keep PRO — the
    // account stays on full access. Don't tell users they were downgraded.
    const text = [
      `היי ${displayName},`,
      '',
      'תקופת הניסיון החינמית שלך הסתיימה — אבל מערכת המנויים עדיין לא פתוחה לתשלום, אז החשבון שלך ממשיך לפעול במלואו בינתיים, בלי שום הגבלה.',
      '',
      'נשלח לך מייל נוסף כשהתשלום ייפתח.',
    ].join('\n')

    await resend.emails.send({
      from: emailFrom(),
      to: input.email,
      subject: 'תקופת הניסיון שלך הסתיימה',
      text,
      html: `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
          <p>היי ${displayName},</p>
          <p>תקופת הניסיון החינמית שלך הסתיימה — אבל מערכת המנויים עדיין לא פתוחה לתשלום, אז החשבון שלך ממשיך לפעול במלואו בינתיים, בלי שום הגבלה.</p>
          <p>נשלח לך מייל נוסף כשהתשלום ייפתח.</p>
        </div>
      `,
    })

    return { sent: true }
  }

  const limitsLines = [
    'תקופת הניסיון החינמית שלך הסתיימה, והחשבון עבר למסלול החינמי.',
    '',
    'שום דבר לא נמחק — כל הגלריות והתמונות שלך נשארות בדיוק כמו שהיו.',
    '',
    'במסלול החינמי יש כמה הבדלים:',
    '• עד 3 תמונות hero בעמוד הבית',
    '• גלריה ציבורית אחת מוצגת בכל רגע נתון',
    '• עד 30 תמונות בגלריה ציבורית',
    '• כמה פיצ׳רים (וידאו hero, פוסטים, המלצות, חבילות, לפני/אחרי, שאלות נפוצות) זמינים רק במסלול המשלם',
    '',
    'האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.',
    '',
    `אפשר לחזור למסלול המלא בכל רגע: ${subscriptionUrl}`,
    ...(siteUrl ? [`לצפייה באתר שלך כרגע: ${siteUrl}`] : []),
  ]

  const text = [`היי ${displayName},`, '', ...limitsLines].join('\n')

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'תקופת הניסיון שלך הסתיימה',
    text,
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p>היי ${displayName},</p>
        <p>תקופת הניסיון החינמית שלך הסתיימה, והחשבון עבר למסלול החינמי.</p>
        <p>שום דבר לא נמחק — כל הגלריות והתמונות שלך נשארות בדיוק כמו שהיו.</p>
        <p>במסלול החינמי יש כמה הבדלים:</p>
        <ul>
          <li>עד 3 תמונות hero בעמוד הבית</li>
          <li>גלריה ציבורית אחת מוצגת בכל רגע נתון</li>
          <li>עד 30 תמונות בגלריה ציבורית</li>
          <li>כמה פיצ׳רים (וידאו hero, פוסטים, המלצות, חבילות, לפני/אחרי, שאלות נפוצות) זמינים רק במסלול המשלם</li>
        </ul>
        <p>האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.</p>
        <p style="margin: 24px 0;">
          <a
            href="${subscriptionUrl}"
            style="display: inline-block; background: #7D3A52; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
          >
            חזרה למסלול המלא
          </a>
          ${siteUrl
            ? `<a
            href="${siteUrl}"
            style="display: inline-block; margin-inline-start: 10px; color: #7D3A52; text-decoration: underline; padding: 12px 4px; font-weight: 600;"
          >
            צפייה באתר שלך
          </a>`
            : ''}
        </p>
      </div>
    `,
  })

  return { sent: true }
}

/**
 * 3-days-left reminder for a one-time-payment subscription (no standing
 * authorization, so nothing renews automatically — see
 * lib/subscriptions/one-time-payment-reminders.ts).
 */
export async function sendOneTimePlanEndingReminderEmail(input: {
  name: string
  email: string
  slug: string | null
}): Promise<{ sent: boolean }> {
  const resend = requireResendOrSafeStub({
    template: 'one-time-plan-ending-reminder',
    email: input.email,
  })
  if (!resend) return { sent: false }

  const subscriptionUrl = appUrl('/dashboard/subscription')
  const siteUrl = input.slug ? appUrl(`/${input.slug}`) : null
  const displayName = input.name.trim() || 'שם'

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'עוד 3 ימים והחשבון שלך חוזר למסלול החינמי',
    text: [
      `היי ${displayName},`,
      '',
      'התשלום החד-פעמי שביצעת ב־Studio Gallery עומד לפוג בעוד 3 ימים.',
      'מכיוון שזה היה תשלום חד-פעמי, לא יתבצע חיוב אוטומטי — כדי להמשיך במסלול המלא צריך לחדש ידנית.',
      '',
      `המשך שדרוג: ${subscriptionUrl}`,
      ...(siteUrl ? ['', `לצפייה באתר שלך כרגע: ${siteUrl}`] : []),
      '',
      'אם לא תחדשי, החשבון יעבור למסלול החינמי — שום דבר לא יימחק.',
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p>היי ${displayName},</p>
        <p>התשלום החד-פעמי שביצעת ב־Studio Gallery עומד לפוג בעוד 3 ימים.</p>
        <p>מכיוון שזה היה תשלום חד-פעמי, לא יתבצע חיוב אוטומטי — כדי להמשיך במסלול המלא צריך לחדש ידנית.</p>
        <p style="margin: 24px 0;">
          <a
            href="${subscriptionUrl}"
            style="display: inline-block; background: #7D3A52; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
          >
            המשך שדרוג
          </a>
          ${siteUrl
            ? `<a
            href="${siteUrl}"
            style="display: inline-block; margin-inline-start: 10px; color: #7D3A52; text-decoration: underline; padding: 12px 4px; font-weight: 600;"
          >
            צפייה באתר שלך
          </a>`
            : ''}
        </p>
        <p>אם לא תחדשי, החשבון יעבור למסלול החינמי — שום דבר לא יימחק.</p>
      </div>
    `,
  })

  return { sent: true }
}

/**
 * Day-zero notification: a one-time-payment subscription just lapsed and the
 * account moved to the FREE plan. Mirrors sendTrialExpiredEmail's copy about
 * what changes on the free plan, with a CTA to pay again.
 */
export async function sendOneTimePlanExpiredEmail(input: {
  name: string
  email: string
  slug: string | null
}): Promise<{ sent: boolean }> {
  const resend = requireResendOrSafeStub({
    template: 'one-time-plan-expired',
    email: input.email,
  })
  if (!resend) return { sent: false }

  const displayName = input.name.trim() || 'שם'
  const subscriptionUrl = appUrl('/dashboard/subscription')
  const siteUrl = input.slug ? appUrl(`/${input.slug}`) : null

  const limitsLines = [
    'התשלום החד-פעמי שלך פג, והחשבון עבר למסלול החינמי.',
    '',
    'שום דבר לא נמחק — כל הגלריות והתמונות שלך נשארות בדיוק כמו שהיו.',
    '',
    'במסלול החינמי יש כמה הבדלים:',
    '• עד 3 תמונות hero בעמוד הבית',
    '• גלריה ציבורית אחת מוצגת בכל רגע נתון',
    '• עד 30 תמונות בגלריה ציבורית',
    '• כמה פיצ׳רים (וידאו hero, פוסטים, המלצות, חבילות, לפני/אחרי, שאלות נפוצות) זמינים רק במסלול המשלם',
    '',
    'האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.',
    '',
    `אפשר לחזור למסלול המלא בכל רגע: ${subscriptionUrl}`,
    ...(siteUrl ? [`לצפייה באתר שלך כרגע: ${siteUrl}`] : []),
  ]

  const text = [`היי ${displayName},`, '', ...limitsLines].join('\n')

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    subject: 'התשלום החד-פעמי שלך פג',
    text,
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p>היי ${displayName},</p>
        <p>התשלום החד-פעמי שלך פג, והחשבון עבר למסלול החינמי.</p>
        <p>שום דבר לא נמחק — כל הגלריות והתמונות שלך נשארות בדיוק כמו שהיו.</p>
        <p>במסלול החינמי יש כמה הבדלים:</p>
        <ul>
          <li>עד 3 תמונות hero בעמוד הבית</li>
          <li>גלריה ציבורית אחת מוצגת בכל רגע נתון</li>
          <li>עד 30 תמונות בגלריה ציבורית</li>
          <li>כמה פיצ׳רים (וידאו hero, פוסטים, המלצות, חבילות, לפני/אחרי, שאלות נפוצות) זמינים רק במסלול המשלם</li>
        </ul>
        <p>האתר הציבורי שלך ממשיך לפעול ולהופיע בחיפוש גוגל כרגיל — שום דבר לא נעלם.</p>
        <p style="margin: 24px 0;">
          <a
            href="${subscriptionUrl}"
            style="display: inline-block; background: #7D3A52; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;"
          >
            חזרה למסלול המלא
          </a>
          ${siteUrl
            ? `<a
            href="${siteUrl}"
            style="display: inline-block; margin-inline-start: 10px; color: #7D3A52; text-decoration: underline; padding: 12px 4px; font-weight: 600;"
          >
            צפייה באתר שלך
          </a>`
            : ''}
        </p>
      </div>
    `,
  })

  return { sent: true }
}

export async function sendFeedbackEmail(input: {
  type: string
  name: string
  email: string
  message: string
  studio?: string
  imageUrl?: string | null
}) {
  const resend = requireResendOrSafeStub({
    template: 'feedback',
    email: input.email,
    extra: { type: input.type },
  })
  if (!resend) return

  const imageHref = input.imageUrl
    ? getTestimonialImagePreviewUrl(input.imageUrl)
      ? appUrl(getTestimonialImagePreviewUrl(input.imageUrl)!)
      : null
    : null
  const imageBlock = imageHref
    ? `
        <p><strong>תמונה מצורפת:</strong></p>
        <p><a href="${imageHref}">פתיחת התמונה</a></p>
        <p><img src="${imageHref}" alt="תמונה מצורפת" style="max-width: 100%; max-height: 480px; border-radius: 8px; border: 1px solid #ddd;" /></p>
      `
    : ''

  await resend.emails.send({
    from: emailFrom(),
    to: getFeedbackEmail(),
    subject: `[משוב] ${input.type} — ${input.name}`,
    html: `
      <div dir="rtl">
        <p><strong>${input.name}</strong> (${input.email})</p>
        ${input.studio ? `<p>סטודיו: ${input.studio}</p>` : ''}
        <p>${input.message}</p>
        ${imageBlock}
      </div>
    `,
  })
}
