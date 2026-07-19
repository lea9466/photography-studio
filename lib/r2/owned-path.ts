/**
 * Canonical storage-key helpers for ownership checks.
 * Never trust a client-supplied path without going through these.
 */

export function canonicalizeStorageKey(raw: string): string | null {
  if (typeof raw !== 'string') return null

  let value = raw.trim()
  if (!value) return null

  try {
    value = decodeURIComponent(value)
  } catch {
    return null
  }

  // Reject absolute URLs — callers must pass object keys only.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null

  value = value.replace(/\\/g, '/').replace(/\/+/g, '/')
  value = value.replace(/^\/+/, '').replace(/\/+$/, '')

  if (!value) return null
  if (value.includes('\0')) return null

  const segments = value.split('/')
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    return null
  }

  return value
}

export function isOwnedStorageKey(
  rawPath: string,
  userId: string,
  resourcePrefix: string
): boolean {
  const key = canonicalizeStorageKey(rawPath)
  if (!key) return false

  const owner = canonicalizeStorageKey(userId)
  const resource = canonicalizeStorageKey(resourcePrefix)
  if (!owner || !resource) return false

  const expectedPrefix = `${owner}/${resource}/`
  return key.startsWith(expectedPrefix) && key.length > expectedPrefix.length
}

export function assertOwnedStorageKey(
  rawPath: string,
  userId: string,
  resourcePrefix: string
): string {
  if (!isOwnedStorageKey(rawPath, userId, resourcePrefix)) {
    throw new Error('נתיב קובץ לא תקין')
  }
  return canonicalizeStorageKey(rawPath)!
}
