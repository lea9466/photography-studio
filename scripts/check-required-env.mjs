#!/usr/bin/env node

/**
 * Fails the build if required production environment variables are missing.
 * Runs automatically before `next build` (see "prebuild" in package.json) so
 * a missing secret is caught at build/CI time instead of at runtime after deploy.
 *
 * Add more entries to REQUIRED_IN_PRODUCTION as more env vars gain a
 * runtime "required in production" check.
 */

const REQUIRED_IN_PRODUCTION = [
  // Determines the only email allowed to log into /manage — must be
  // explicitly configured in production (see lib/feedback-email.ts).
  'FEEDBACK_EMAIL',
]

const isVercel = Boolean(process.env.VERCEL)
const targetEnv = isVercel ? process.env.VERCEL_ENV : process.env.NODE_ENV

if (targetEnv !== 'production') {
  console.log(`[check-required-env] Skipping — target env is "${targetEnv || 'unknown'}".`)
  process.exit(0)
}

const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim())

if (missing.length > 0) {
  console.error(
    '[check-required-env] Missing required environment variable(s) for production:\n' +
      missing.map((key) => `  - ${key}`).join('\n')
  )
  process.exit(1)
}

console.log('[check-required-env] All required production environment variables are set.')
