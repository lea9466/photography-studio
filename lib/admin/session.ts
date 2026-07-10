import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { requireSessionSecret } from '@/lib/session-secret'

const OTP_COOKIE = 'sg_admin_otp'
const SESSION_COOKIE = 'sg_admin_session'
const OTP_TTL_MS = 15 * 60 * 1000
const SESSION_TTL_SEC = 24 * 60 * 60

function getSecret() {
  return requireSessionSecret('GALLERY_SESSION_SECRET', 'dev-admin-secret')
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function safeEqual(a: string, b: string) {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/manage',
  }
}

export function generateAdminOtpCode() {
  return String(randomInt(100000, 999999))
}

export async function setPendingAdminOtp(code: string) {
  const exp = Date.now() + OTP_TTL_MS
  const payload = `${code}:${exp}`
  const token = `${payload}:${sign(payload)}`
  const cookieStore = await cookies()
  cookieStore.set(OTP_COOKIE, token, cookieOptions(Math.floor(OTP_TTL_MS / 1000)))
}

export async function verifyPendingAdminOtp(code: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(OTP_COOKIE)?.value
  if (!raw) return false

  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false

  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  if (!safeEqual(sign(payload), sig)) return false

  const sep = payload.indexOf(':')
  if (sep <= 0) return false

  const storedCode = payload.slice(0, sep)
  const exp = Number(payload.slice(sep + 1))
  if (!Number.isFinite(exp) || Date.now() > exp) return false
  if (!safeEqual(storedCode, code.trim())) return false

  return true
}

export async function clearPendingAdminOtp() {
  const cookieStore = await cookies()
  cookieStore.delete(OTP_COOKIE)
}

export async function setAdminSession() {
  const exp = Date.now() + SESSION_TTL_SEC * 1000
  const payload = `admin:${exp}`
  const token = `${payload}:${sign(payload)}`
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SEC))
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function verifyAdminSessionToken(raw: string | undefined | null) {
  if (!raw) return false

  const lastColon = raw.lastIndexOf(':')
  if (lastColon <= 0) return false

  const sig = raw.slice(lastColon + 1)
  const payload = raw.slice(0, lastColon)
  if (!safeEqual(sign(payload), sig)) return false

  const sep = payload.indexOf(':')
  if (sep <= 0) return false

  const exp = Number(payload.slice(sep + 1))
  return Number.isFinite(exp) && Date.now() <= exp
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  return verifyAdminSessionToken(raw)
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error('אין הרשאת ניהול')
  }
}
