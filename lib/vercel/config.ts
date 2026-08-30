import { VercelError } from './errors'

export const VERCEL_API_BASE_URL = 'https://api.vercel.com'

/**
 * Generic CNAME target for a subdomain (e.g. www.johnphoto.com) added to any
 * Vercel project — a stable, documented convention, not project-specific.
 */
export const VERCEL_CNAME_TARGET = 'cname.vercel-dns.com'

/**
 * Vercel's anycast IP for an apex/root domain (johnphoto.com, no subdomain)
 * — DNS forbids a CNAME at the root (it must coexist with other record
 * types like MX), so apex domains use an A record to this fixed IP instead.
 * Same value used to validate the whole flow works in the Aug 2026 custom-
 * domain spike (curl --resolve against this exact IP).
 */
export const VERCEL_APEX_A_RECORD = '76.76.21.21'

function required(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()
  if (!value) throw new VercelError('not_configured')
  return value
}

function optional(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()
  return value || null
}

export type VercelConfig = {
  apiToken: string
  projectId: string
  /** Only set when the Vercel project lives under a Team, not a personal account. */
  teamId: string | null
}

export function getVercelConfig(): VercelConfig {
  return {
    apiToken: required('VERCEL_API_TOKEN'),
    projectId: required('VERCEL_PROJECT_ID'),
    teamId: optional('VERCEL_TEAM_ID'),
  }
}

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN?.trim() && process.env.VERCEL_PROJECT_ID?.trim())
}
