function firstNonEmptyEnv(...keys: string[]): string {
  for (const key of keys) {
    const trimmed = process.env[key]?.trim()
    if (trimmed) return trimmed.replace(/\/+$/, '')
  }
  return ''
}

/** בסיס URL ציבורי לקבצים ב-R2 (Custom Domain או r2.dev). */
export function r2PublicBaseUrl(): string {
  return firstNonEmptyEnv(
    'NEXT_PUBLIC_R2_PUBLIC_URL',
    'R2_PUBLIC_URL',
    'NEXT_PUBLIC_R2_BASE_URL'
  )
}

export function galleryMediaProxyUrl(key: string): string {
  const normalizedKey = key.replace(/^\/+/, '')
  return `/api/gallery-media?key=${encodeURIComponent(normalizedKey)}`
}

export function r2PublicUrlFromKey(key: string): string {
  const base = r2PublicBaseUrl()
  const normalizedKey = key.replace(/^\/+/, '')
  if (!base) return galleryMediaProxyUrl(normalizedKey)
  return `${base}/${normalizedKey}`
}

export function isR2PublicUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim()
  if (!trimmed) return false
  const base = r2PublicBaseUrl()
  if (base && trimmed.startsWith(`${base}/`)) return true
  return (
    trimmed.includes('/photographers/') || trimmed.includes('/galleries/')
  )
}

export function r2KeyFromPublicUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  const base = r2PublicBaseUrl()
  if (base && trimmed.startsWith(`${base}/`)) {
    return trimmed.slice(base.length + 1)
  }

  const photographersIndex = trimmed.indexOf('photographers/')
  if (photographersIndex >= 0) return trimmed.slice(photographersIndex)

  const galleriesIndex = trimmed.indexOf('galleries/')
  if (galleriesIndex >= 0) return trimmed.slice(galleriesIndex)

  return null
}

export function r2PublicConfigured(): boolean {
  return !!r2PublicBaseUrl()
}
