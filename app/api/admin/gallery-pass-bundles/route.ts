import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

type BundlePatch = {
  photo_cap?: number
  validity_days?: number
  amount_agorot?: number
  is_active?: boolean
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gallery_pass_bundles')
    .select('*')
    .order('display_order', { ascending: true })

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'טעינת הבאנדלים נכשלה' },
      { status: 500 }
    )
  }

  return NextResponse.json({ bundles: data })
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  let body: { id?: string; patch?: BundlePatch }
  try {
    body = (await request.json()) as { id?: string; patch?: BundlePatch }
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const patch = body.patch
  if (!id || !patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'חסר מזהה באנדל או עדכון' }, { status: 400 })
  }

  const sanitized: BundlePatch = {}
  for (const key of ['photo_cap', 'validity_days', 'amount_agorot'] as const) {
    const value = patch[key]
    if (value === undefined) continue
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json(
        { error: 'מספר תמונות, ימי תוקף ומחיר חייבים להיות מספרים חיוביים' },
        { status: 400 }
      )
    }
    sanitized[key] = Math.round(value)
  }
  if (typeof patch.is_active === 'boolean') {
    sanitized.is_active = patch.is_active
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'לא התקבלו שדות לעדכון' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gallery_pass_bundles')
    .update(sanitized as never)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'עדכון הבאנדל נכשל' },
      { status: 500 }
    )
  }

  return NextResponse.json({ bundle: data })
}
