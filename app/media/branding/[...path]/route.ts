import { downloadMediaObject } from '@/lib/r2/storage'
import { isR2Configured } from '@/lib/r2/config'

function contentTypeFromPath(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'application/octet-stream'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!isR2Configured()) {
    return new Response('Not found', { status: 404 })
  }

  const { path } = await params
  const storagePath = path.map(decodeURIComponent).join('/')

  if (!storagePath || storagePath.includes('..')) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const data = await downloadMediaObject('branding', storagePath)
    return new Response(Buffer.from(data), {
      headers: {
        'Content-Type': contentTypeFromPath(storagePath),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
