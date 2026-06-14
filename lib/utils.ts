import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type EmailHint = {
  start: string
  end: string
}

export function getEmailHint(email: string): EmailHint | null {
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return null

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const tld = domain.includes('.')
    ? domain.slice(domain.lastIndexOf('.') + 1)
    : domain.slice(-Math.min(3, domain.length))

  if (!local || !tld) return null

  return {
    start: local.slice(0, Math.min(2, local.length)),
    end: tld,
  }
}

export function formatEmailHintMessage(hint: EmailHint) {
  return `נשלחה סיסמה למייל שמתחיל ב-${hint.start} ומסתיים ב-${hint.end}`
}
