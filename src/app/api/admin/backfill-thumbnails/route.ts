import { NextResponse } from 'next/server'
import {
  adminAuthJsonResponse,
  requirePhotographerSession,
} from '@/lib/api-auth-helpers'

/** מיניאטורות נוצרות בדפדפן (WebP) ונשמרות ב-R2 — אין backfill נדרש. */
export async function POST() {
  const auth = await requirePhotographerSession()
  if (!auth.ok) return adminAuthJsonResponse(auth)

  return NextResponse.json({
    ok: true,
    processed: 0,
    failed: 0,
    remaining: 0,
    message:
      'לא נדרש backfill — מיניאטורות נוצרות בהעלאה ונשמרות ב-Cloudflare R2.',
  })
}
