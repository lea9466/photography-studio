import { resolveMediaUrl } from '@/lib/r2/storage'

export async function resolveBrandingPath(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return resolveMediaUrl('branding', pathOrUrl)
}

export async function resolveBrandingPaths(
  paths: string[] | null | undefined
): Promise<string[]> {
  if (!paths?.length) return []
  const resolved = await Promise.all(
    paths.slice(0, 3).map(async (path) => {
      if (!path) return ''
      const url = await resolveBrandingPath(path)
      return url ?? ''
    })
  )
  return resolved
}

export function padHeroUrlSlots(resolved: string[]) {
  const slots = ['', '', '']
  resolved.slice(0, 3).forEach((url, index) => {
    slots[index] = url
  })
  return slots
}
