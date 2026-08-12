import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/session'
import { SupabaseBillingRepository } from '@/lib/payments/repository'

export const dynamic = 'force-dynamic'

type PlanPatch = {
  name?: string
  amount_agorot?: number
  compare_at_amount_agorot?: number | null
  badge?: string | null
  is_highlighted?: boolean
  is_active?: boolean
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  const repository = new SupabaseBillingRepository(createAdminClient())
  const plans = await repository.listActivePlans()
  return NextResponse.json({ plans })
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  let body: { id?: string; patch?: PlanPatch }
  try {
    body = (await request.json()) as { id?: string; patch?: PlanPatch }
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const patch = body.patch
  if (!id || !patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'חסר מזהה תוכנית או עדכון' }, { status: 400 })
  }

  const sanitized: PlanPatch = {}
  if (typeof patch.name === 'string') {
    const name = patch.name.trim()
    if (!name) return NextResponse.json({ error: 'שם התוכנית ריק' }, { status: 400 })
    sanitized.name = name
  }
  if (typeof patch.amount_agorot === 'number') {
    if (!Number.isFinite(patch.amount_agorot) || patch.amount_agorot <= 0) {
      return NextResponse.json({ error: 'מחיר חייב להיות מספר חיובי' }, { status: 400 })
    }
    sanitized.amount_agorot = Math.round(patch.amount_agorot)
  }
  if (patch.compare_at_amount_agorot === null) {
    sanitized.compare_at_amount_agorot = null
  } else if (typeof patch.compare_at_amount_agorot === 'number') {
    if (
      !Number.isFinite(patch.compare_at_amount_agorot) ||
      patch.compare_at_amount_agorot <= 0
    ) {
      return NextResponse.json({ error: 'מחיר ההשוואה חייב להיות מספר חיובי' }, { status: 400 })
    }
    sanitized.compare_at_amount_agorot = Math.round(patch.compare_at_amount_agorot)
  }
  if (patch.badge === null) {
    sanitized.badge = null
  } else if (typeof patch.badge === 'string') {
    sanitized.badge = patch.badge.trim().slice(0, 60)
  }
  if (typeof patch.is_highlighted === 'boolean') {
    sanitized.is_highlighted = patch.is_highlighted
  }
  if (typeof patch.is_active === 'boolean') {
    sanitized.is_active = patch.is_active
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'לא התקבלו שדות לעדכון' }, { status: 400 })
  }

  const repository = new SupabaseBillingRepository(createAdminClient())
  try {
    const updated = await repository.updatePlan(id, sanitized)
    return NextResponse.json({ plan: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'עדכון התוכנית נכשל'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
