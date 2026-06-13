import 'server-only'

function resendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim()
  return key || null
}

export function emailFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || 'סטודיו <onboarding@resend.dev>'
}

export function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`

  return 'http://localhost:3000'
}

export function isEmailConfigured(): boolean {
  return !!resendApiKey()
}

export function emailConfigError(): string {
  return 'שליחת מייל אינה מוגדרת. הוסיפו RESEND_API_KEY ו-EMAIL_FROM ל-.env.local'
}

async function sendEmail(args: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error: string | null }> {
  const apiKey = resendApiKey()
  if (!apiKey) {
    return { ok: false, error: emailConfigError() }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFromAddress(),
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Resend error:', response.status, body)
      return { ok: false, error: 'שגיאה בשליחת המייל' }
    }

    return { ok: true, error: null }
  } catch (error) {
    console.error('Resend fetch failed:', error)
    return { ok: false, error: 'שגיאה בשליחת המייל' }
  }
}

export async function sendClientAccessCodeEmail(args: {
  to: string
  accessCode: string
  studioName: string
  loginUrl: string
}): Promise<{ ok: boolean; error: string | null }> {
  return sendEmail({
    to: args.to,
    subject: `קוד גישה חדש — ${args.studioName}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6">
        <p>שלום,</p>
        <p>קוד הגישה החדש שלכם לאזור הלקוח ב-<strong>${args.studioName}</strong>:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:2px">${args.accessCode}</p>
        <p>התחברו עם האימייל שלכם והקוד בקישור:</p>
        <p><a href="${args.loginUrl}">${args.loginUrl}</a></p>
      </div>
    `,
  })
}

export async function sendAuthRecoveryEmail(args: {
  to: string
  resetUrl: string
  subject: string
}): Promise<{ ok: boolean; error: string | null }> {
  return sendEmail({
    to: args.to,
    subject: args.subject,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6">
        <p>שלום,</p>
        <p>קיבלנו בקשה לאיפוס סיסמה.</p>
        <p><a href="${args.resetUrl}">לחצו כאן להגדרת סיסמה חדשה</a></p>
        <p>הקישור תקף לזמן מוגבל. אם לא ביקשתם איפוס, התעלמו מהודעה זו.</p>
      </div>
    `,
  })
}

export async function sendPlatformResetLinkEmail(args: {
  to: string
  resetUrl: string
}): Promise<{ ok: boolean; error: string | null }> {
  return sendAuthRecoveryEmail({
    to: args.to,
    resetUrl: args.resetUrl,
    subject: 'איפוס סיסמה — מנהל פלטפורמה',
  })
}
