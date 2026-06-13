import { NextResponse } from 'next/server'
import { adminDeleteReservedImages } from '@/lib/admin-db'
import {
  adminAuthJsonResponse,
  requirePhotographerSession,
  verifyImageIdsOwnedByPhotographer,
} from '@/lib/api-auth-helpers'
import { adminConfigError, getAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  if (!getAdminClient()) {
    return NextResponse.json(
      { ok: false, message: adminConfigError() },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'גוף הבקשה אינו JSON תקין' },
      { status: 400 }
    )
  }

  const record = body as Record<string, unknown>
  const rawIds = record.image_ids
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return NextResponse.json({ ok: true, message: 'אין שורות למחיקה' })
  }

  const imageIds = rawIds.map((id) => String(id).trim()).filter(Boolean)

  const auth = await requirePhotographerSession()
  if (!auth.ok) return adminAuthJsonResponse(auth)

  const ownership = await verifyImageIdsOwnedByPhotographer(
    auth.photographerId,
    imageIds
  )
  if (!ownership.ok) return adminAuthJsonResponse(ownership)

  const { error } = await adminDeleteReservedImages(imageIds)
  if (error) {
    return NextResponse.json({ ok: false, message: error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: `${imageIds.length} שורות הוסרו`,
  })
}
