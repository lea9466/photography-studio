export function requireSessionSecret(
  envKey: 'GALLERY_SESSION_SECRET',
  devFallback: string
) {
  const value = process.env[envKey]?.trim()
  if (value) return value

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envKey} is required in production`)
  }

  return devFallback
}
