import { timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12
const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/

export function isBcryptHash(value: string) {
  return BCRYPT_PREFIX.test(value)
}

export async function hashGalleryPassword(plain: string) {
  const normalized = plain.trim()
  if (!normalized) {
    throw new Error('סיסמה לא תקינה')
  }
  return bcrypt.hash(normalized, BCRYPT_ROUNDS)
}

function safeEqualStrings(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function verifyGalleryPassword(
  plain: string,
  stored: string | null
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!stored) return { valid: false, needsRehash: false }

  const normalized = plain.trim()

  if (isBcryptHash(stored)) {
    const valid = await bcrypt.compare(normalized, stored)
    return { valid, needsRehash: false }
  }

  const valid = safeEqualStrings(normalized, stored)
  return { valid, needsRehash: valid }
}

export function generateGalleryPassword() {
  return Math.random().toString(36).slice(2, 10)
}
