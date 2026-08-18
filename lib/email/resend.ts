import { Resend } from 'resend'

import { getAdminName, getFeedbackEmail } from '@/lib/feedback-email'
import { getTestimonialImagePreviewUrl } from '@/lib/testimonial-image-url'
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
  password: string
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
    subject: `סיסמת הגלריה: ${input.galleryTitle}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif;">
        <h2>שלום ${input.clientName},</h2>
        <p>הסיסמה לגלריה <strong>${input.galleryTitle}</strong> היא:</p>
        <p style="font-size: 1.25rem;"><strong>${input.password}</strong></p>
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

export async function sendWelcomeEmail(input: {
  name: string
  email: string
}) {
  const resend = requireResendOrSafeStub({
    template: 'welcome',
    email: input.email,
  })
  if (!resend) return

  const supportEmail = getFeedbackEmail()
  const adminName = getAdminName()

  await resend.emails.send({
    from: emailFrom(),
    to: input.email,
    replyTo: supportEmail,
    subject: 'איזה כיף שהצטרפת! הסטודיו שלך מוכן 📸',
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
        <p style="font-size: 1.1rem;">👋 היי ${input.name},</p>
        <p>🎉 איזה כיף שהצטרפת אלינו! הסטודיו הדיגיטלי החדש שלך רשום ומוכן לעבודה.</p>
        <p>✨ בניתי את המערכת הזו מתוך מטרה לאפשר לכל צלמת להקים אתר עסקי מהיר ומקצועי בקלות ובמהירות, ואני מתרגשת לראות את האתר שלך קורם עור וגידים.</p>
        <p><strong>🚀 כמה דברים קצרים שתוכלי לעשות כבר עכשיו באתר שלך:</strong></p>
        <ul style="padding-right: 1.25rem;">
          <li style="margin-bottom: 0.5rem;">📸 <strong>להעלות את העבודות שלך:</strong> הקימי גלריות מרהיבות שיציגו את הצילומים שלך בצורה הכי איכותית ומהירה שיש.</li>
          <li style="margin-bottom: 0.5rem;">💎 <strong>להגדיר חבילות ומחירים:</strong> הציגי ללקוחות את חבילות הצילום השונות שלך בצורה ברורה ומסודרת.</li>
          <li style="margin-bottom: 0.5rem;">✍️ <strong>לפתוח בלוג אישי:</strong> תוכלי לכתוב פוסטים, לשתף הצצות מאחורי הקלעים ולתת טיפים ללקוחות שלך (זה גם מעולה לקידום האתר בגוגל!).</li>
          <li style="margin-bottom: 0.5rem;">🎨 <strong>לעצב בקלות:</strong> להוסיף לוגו, לשנות תמונות רקע ולהתאים את האתר לקו העסקי שלך (בלי לגעת בקוד בכלל).</li>
        </ul>
        <p><strong>💬 צריכה עזרה? אני כאן!</strong></p>
        <p>אם את מסתבכת, צריכה תמיכה בהקמה הבסיסית או סתם רוצה להתייעץ – אל תהססי לפנות אלי. אני זמינה בשבילך לכל שאלה בכתובת המייל של מנהלת המערכת: <a href="mailto:${supportEmail}">${supportEmail}</a> 📧, או באמצעות טאב יצירת הקשר שבמערכת.</p>
        <p><strong>🎁 רוצה לקבל חודשי שימוש במתנה?</strong></p>
        <p>כרגע המערכת פתוחה לשימוש בחינם, אבל יש לך הזדמנות לצבור חודשי פרימיום לעתיד! <a href="${appUrl('/dashboard/subscription')}">באזור האישי</a> שלך מחכה לך קישור שיתוף ייחודי 🔗. אם תשתפי אותו עם חברה צלמת והיא תפתח סטודיו דרך הקישור שלך – את תקבלי אוטומטית חודש נוסף מלא בחינם, והיא תקבל אתר מדהים. שווה, לא? 😉</p>
        <p>🌟 שיהיה המון בהצלחה, ואני מחכה כבר לראות את האתר המוכן שלך!</p>
        <p>💜 ${adminName}</p>
      </div>
    `,
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
