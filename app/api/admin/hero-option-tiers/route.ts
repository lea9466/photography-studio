import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/session'
import {
  isHeroOptionKey,
  normalizeHeroOptionTiers,
  type HeroOptionKey,
  type HeroOptionTier,
} from '@/lib/public-site/hero-settings'

export const dynamic = 'force-dynamic'

async function readTiers() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('hero_option_tiers').select('option_key, tier')
  if (error) return { error: error.message }
  return { tiers: normalizeHeroOptionTiers(data as { option_key: string; tier: string }[] | null) }
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  const result = await readTiers()
  if ('error' in result) {
    return NextResponse.json({ error: result.error ?? 'טעינת ההגדרות נכשלה' }, { status: 500 })
  }
  return NextResponse.json(result)
}

/** Body: { changes: [{ option_key, tier }, ...] } — one switch, or a bulk "all free / all PRO". */
export async function PUT(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  let body: { changes?: unknown }
  try {
    body = (await request.json()) as { changes?: unknown }
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const changes: { option_key: HeroOptionKey; tier: HeroOptionTier }[] = []
  for (const change of Array.isArray(body.changes) ? body.changes : []) {
    const { option_key, tier } = (change ?? {}) as { option_key?: unknown; tier?: unknown }
    if (!isHeroOptionKey(option_key) || (tier !== 'free' && tier !== 'pro')) {
      return NextResponse.json({ error: 'אפשרות או רמה לא מוכרת' }, { status: 400 })
    }
    changes.push({ option_key, tier })
  }
  if (changes.length === 0) {
    return NextResponse.json({ error: 'לא התקבלו שינויים' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('hero_option_tiers').upsert(changes as never, { onConflict: 'option_key' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = await readTiers()
  if ('error' in result) {
    return NextResponse.json({ error: result.error ?? 'טעינת ההגדרות נכשלה' }, { status: 500 })
  }
  return NextResponse.json(result)
}
