import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { cleanupOrphanedPhotos } from '@/lib/cleanup/orphaned-photos'

// Constant-time string comparison — avoids leaking how many leading
// characters of CRON_SECRET matched via response-time differences.
// timingSafeEqual throws on mismatched buffer lengths, so unequal-length
// inputs are rejected as `false` before ever reaching it.
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  return timingSafeStringEqual(authHeader, `Bearer ${cronSecret}`)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await cleanupOrphanedPhotos()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Cleanup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
