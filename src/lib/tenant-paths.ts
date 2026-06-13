/** נתיב בסיס לדפים של tenant: /{slug}/... */
export function tenantPath(slug: string, path = ''): string {
  const base = `/${encodeURIComponent(slug)}`
  if (!path || path === '/') return base
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function tenantHashPath(slug: string, hash: string): string {
  const clean = hash.startsWith('#') ? hash : `#${hash}`
  return `${tenantPath(slug)}${clean}`
}

export function tenantQueryHashPath(
  slug: string,
  query: Record<string, string | undefined>,
  hash: string
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  const cleanHash = hash.startsWith('#') ? hash : `#${hash}`
  const base = tenantPath(slug)
  return qs ? `${base}?${qs}${cleanHash}` : `${base}${cleanHash}`
}
