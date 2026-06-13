import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/**
 * סשן אזור-לקוח קליל מבוסס עוגייה חתומה (HMAC).
 * אין כאן Supabase Auth — הזיהוי הוא אימייל + קוד גישה שהאדמין קובע,
 * והעוגייה שומרת את מזהה הלקוח חתום כדי שלא ניתן יהיה לזייף אותו.
 */

const COOKIE_NAME = 'ps_client'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 יום

function secret(): string {
  return (
    process.env.CLIENT_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'ps-dev-secret-change-me'
  )
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function verify(value: string, signature: string): boolean {
  const expected = sign(value)
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function createClientSession(clientId: string): Promise<void> {
  const store = await cookies()
  const token = `${clientId}.${sign(clientId)}`
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function getClientSession(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null

  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null

  const clientId = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!verify(clientId, signature)) return null

  return clientId
}

export async function clearClientSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
