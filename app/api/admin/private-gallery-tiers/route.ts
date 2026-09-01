import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

type TierPatch = {
  max_galleries?: number
  max_photos_per_gallery?: number
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  const admin = createAdminClient()
  const [{ data: tiers, error: tiersError }, { data: plans, error: plansError }] =
    await Promise.all([
      admin.from('private_gallery_tiers').select('*').order('display_order', { ascending: true }),
      admin
        .from('subscription_plans')
        .select('id, code, name, amount_agorot, currency')
        .eq('product', 'private_galleries'),
    ])

  if (tiersError || !tiers) {
    return NextResponse.json({ error: tiersError?.message ?? 'טעינת המסלולים נכשלה' }, { status: 500 })
  }
  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 })
  }

  const plansById = new Map((plans ?? []).map((plan) => [plan.id, plan]))
  const rows = tiers.map((tier) => ({
    ...tier,
    plan: tier.plan_id ? (plansById.get(tier.plan_id) ?? null) : null,
  }))

  return NextResponse.json({ tiers: rows })
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  let body: { id?: string; patch?: TierPatch }
  try {
    body = (await request.json()) as { id?: string; patch?: TierPatch }
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const patch = body.patch
  if (!id || !patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'חסר מזהה מסלול או עדכון' }, { status: 400 })
  }

  const sanitized: TierPatch = {}
  if (patch.max_galleries !== undefined) {
    if (!Number.isFinite(patch.max_galleries) || patch.max_galleries <= 0) {
      return NextResponse.json({ error: 'מספר גלריות חייב להיות מספר שלם חיובי' }, { status: 400 })
    }
    sanitized.max_galleries = Math.round(patch.max_galleries)
  }
  if (patch.max_photos_per_gallery !== undefined) {
    if (!Number.isFinite(patch.max_photos_per_gallery) || patch.max_photos_per_gallery <= 0) {
      return NextResponse.json({ error: 'מספר תמונות חייב להיות מספר שלם חיובי' }, { status: 400 })
    }
    sanitized.max_photos_per_gallery = Math.round(patch.max_photos_per_gallery)
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'לא התקבלו שדות לעדכון' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('private_gallery_tiers')
    .update(sanitized as never)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'עדכון המסלול נכשל' }, { status: 500 })
  }

  return NextResponse.json({ tier: data })
}
