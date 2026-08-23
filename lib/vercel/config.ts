import { VercelError } from './errors'

export const VERCEL_API_BASE_URL = 'https://api.vercel.com'

/**
 * Generic CNAME target for a subdomain (e.g. www.johnphoto.com) added to any
 * Vercel project — a stable, documented convention, not project-specific.
 * v1 requires a subdomain (see lib/validations/domain.ts), so apex domains
 * (which would need an A record to 76.76.21.21 instead) aren't supported yet.
 */
export const VERCEL_CNAME_TARGET = 'cname.vercel-dns.com'

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
