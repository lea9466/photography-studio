import { getR2ObjectBytes } from '@/lib/r2-storage'
import { r2Configured } from '@/lib/r2'

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function isAllowedGalleryMediaKey(key: string): boolean {
  const normalized = key.replace(/^\/+/, '').trim()
  if (!normalized || normalized.includes('..')) return false
  return (
    normalized.startsWith('photographers/') ||
    normalized.startsWith('galleries/')
  )
}

function legacyGalleryMediaKey(key: string): string | null {
  const match = key.match(/^photographers\/[^/]+\/(galleries\/.+)$/)
  return match?.[1] ?? null
}

async function fetchGalleryObject(key: string) {
  const primary = await getR2ObjectBytes(key)
  if (primary.data || primary.error !== 'קובץ לא נמצא') {
    return primary
  }

  const legacyKey = legacyGalleryMediaKey(key)
  if (!legacyKey || legacyKey === key) return primary
  return getR2ObjectBytes(legacyKey)
}

export async function GET(request: Request) {
  if (!r2Configured()) {
    return textResponse('אחסון תמונות לא מוגדר', 503)
  }

  const key = new URL(request.url).searchParams.get('key')?.trim() ?? ''
  if (!isAllowedGalleryMediaKey(key)) {
    return textResponse('לא נמצא', 404)
  }

  const { data, contentType, error } = await fetchGalleryObject(key)
  if (error || !data) {
    const status = error === 'קובץ לא נמצא' ? 404 : 500
    return textResponse(error ?? 'שגיאה בטעינת התמונה', status)
  }

  return new Response(Buffer.from(data), {
    headers: {
      'Content-Type': contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
