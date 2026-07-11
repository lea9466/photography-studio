export type LogoFileKind = 'png' | 'jpeg' | 'webp' | 'svg' | 'unknown'

export function getLogoFileKind(pathOrFileName: string): LogoFileKind {
  const ext = pathOrFileName.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'png'
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg'
  if (ext === 'webp') return 'webp'
  if (ext === 'svg') return 'svg'
  return 'unknown'
}

export function isRasterLogoKind(kind: LogoFileKind): kind is 'png' | 'jpeg' | 'webp' {
  return kind === 'png' || kind === 'jpeg' || kind === 'webp'
}

export function getBrandingFaviconStoragePath(
  userId: string,
  logoPath: string | null | undefined
): string | null {
  if (!logoPath?.trim()) return null

  const kind = getLogoFileKind(logoPath)
  if (kind === 'png' || kind === 'svg') return `${userId}/favicon.png`
  if (kind === 'jpeg') return `${userId}/favicon.jpg`
  if (kind === 'webp') return `${userId}/favicon.webp`
  return `${userId}/favicon.png`
}
