'use server'

export type ContactActionResult = { ok: boolean; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** מקור הפנייה — קובע את ניסוח ההודעה שתגיע לצלמת. */
type ContactSource = 'general' | 'package' | 'gallery'

function resolveSource(value: string): ContactSource {
  if (value === 'package') return 'package'
  if (value === 'gallery') return 'gallery'
  return 'general'
}

/**
 * מנרמל את כתובת ה-webhook של Make. תומך בטעויות העתקה נפוצות:
 * - חסר scheme: "hook.eu1.make.com/abc" → "https://hook.eu1.make.com/abc"
 * - פורמט שגוי "id@host" → "https://host/id"
 * מחזיר null אם הכתובת לא ניתנת לתיקון לכתובת חוקית.
 */
function normalizeWebhookUrl(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null

  // "id@hook.eu1.make.com" → "https://hook.eu1.make.com/id"
  if (!value.includes('://') && value.includes('@')) {
    const [id, host] = value.split('@')
    if (id && host) value = `https://${host}/${id}`
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    return new URL(value).toString()
  } catch {
    return null
  }
}

/** בונה כותרת ותקציר מותאמים לפי המקור והחבילה. */
function buildSummary(input: {
  source: ContactSource
  packageTitle: string
  isFeatured: boolean
}): { subject: string; summary: string } {
  const { source, packageTitle, isFeatured } = input

  if (source === 'package' && packageTitle) {
    if (isFeatured) {
      return {
        subject: `פנייה חדשה — חבילת פרימיום: ${packageTitle}`,
        summary: `מישהו התעניין בקשר לצילום — חבילת פרימיום "${packageTitle}".`,
      }
    }
    return {
      subject: `פנייה חדשה — חבילה: ${packageTitle}`,
      summary: `מישהו התעניין בקשר לצילום — חבילת "${packageTitle}".`,
    }
  }

  if (source === 'gallery') {
    return {
      subject: 'פנייה חדשה מהגלריה — התעניינות בצילום',
      summary: 'מישהו התעניין בקשר לצילום אחרי צפייה בגלריה.',
    }
  }

  return {
    subject: 'פנייה חדשה מהאתר — התעניינות בצילום',
    summary: 'מישהו התעניין בקשר לצילום.',
  }
}

export async function submitContactAction(
  _prev: ContactActionResult,
  formData: FormData
): Promise<ContactActionResult> {
  // Honeypot — בוטים ממלאים את השדה המוסתר. מחזירים "הצלחה" כדי לא לחשוף את המלכודת.
  if (String(formData.get('company') ?? '').trim()) {
    return { ok: true, message: 'תודה! הפנייה התקבלה ונחזור אליכם בהקדם.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  const source = resolveSource(String(formData.get('source') ?? '').trim())
  const packageTitle = String(formData.get('packageTitle') ?? '').trim()
  const packageId = String(formData.get('packageId') ?? '').trim()
  const isFeatured = String(formData.get('isFeatured') ?? '') === 'true'

  if (!name) {
    return { ok: false, message: 'יש להזין שם' }
  }
  if (!phone && !email) {
    return { ok: false, message: 'יש להזין טלפון או אימייל ליצירת קשר' }
  }
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, message: 'כתובת האימייל אינה תקינה' }
  }

  const rawWebhookUrl = process.env.MAKE_WEBHOOK_URL?.trim()
  if (!rawWebhookUrl) {
    console.error('MAKE_WEBHOOK_URL is not set — contact submission was not sent')
    return {
      ok: false,
      message: 'שליחת הפנייה אינה זמינה כרגע. נסו שוב מאוחר יותר או צרו קשר ישירות.',
    }
  }

  const webhookUrl = normalizeWebhookUrl(rawWebhookUrl)
  if (!webhookUrl) {
    console.error(
      'MAKE_WEBHOOK_URL is not a valid URL. Expected https://hook.<region>.make.com/<id>. Got:',
      rawWebhookUrl
    )
    return {
      ok: false,
      message: 'שליחת הפנייה אינה זמינה כרגע. נסו שוב מאוחר יותר או צרו קשר ישירות.',
    }
  }

  const { subject, summary } = buildSummary({ source, packageTitle, isFeatured })

  const payload = {
    name,
    phone,
    email,
    message,
    source,
    packageId,
    packageTitle,
    isFeatured,
    subject,
    summary,
    createdAt: new Date().toISOString(),
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('Make webhook responded with status', res.status)
      return {
        ok: false,
        message: 'אירעה שגיאה בשליחת הפנייה. נסו שוב או צרו קשר ישירות.',
      }
    }
  } catch (error) {
    console.error('Failed to POST contact to Make webhook:', error)
    return {
      ok: false,
      message: 'אירעה שגיאה בשליחת הפנייה. נסו שוב או צרו קשר ישירות.',
    }
  }

  return { ok: true, message: 'תודה! הפנייה התקבלה ונחזור אליכם בהקדם.' }
}
