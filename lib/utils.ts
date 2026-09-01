import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks a client email for display on the gallery gate: keeps only the first
 * few characters of the local part and the TLD, e.g. `lea********.com`. The
 * domain name itself is hidden. Returns null for anything unparseable.
 */
export function maskEmail(email: string): string | null {
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return null

  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const lastDot = domain.lastIndexOf('.')
  const tld = lastDot >= 0 ? domain.slice(lastDot + 1) : ''

  if (!local || !tld) return null

  const head = local.slice(0, Math.min(3, local.length))
  return `${head}${'*'.repeat(8)}.${tld}`
}
