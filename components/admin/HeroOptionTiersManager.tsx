'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DEFAULT_HERO_OPTION_TIERS,
  HERO_FEATURE_KEYS,
  HERO_FEATURE_LABELS,
  HERO_LAYOUT_IDS,
  HERO_LAYOUT_LABELS,
  HERO_OPTION_KEYS,
  layoutOptionKey,
  type HeroOptionKey,
  type HeroOptionTier,
  type HeroOptionTiers,
} from '@/lib/public-site/hero-settings'

type Row = { key: HeroOptionKey; name: string; description: string }

const LAYOUT_ROWS: Row[] = HERO_LAYOUT_IDS.map((id) => ({ key: layoutOptionKey(id), ...HERO_LAYOUT_LABELS[id] }))
const FEATURE_ROWS: Row[] = HERO_FEATURE_KEYS.map((key) => ({ key, ...HERO_FEATURE_LABELS[key] }))

function TierSwitch({
  value,
  disabled,
  onChange,
}: {
  value: HeroOptionTier
  disabled: boolean
  onChange: (tier: HeroOptionTier) => void
}) {
  const option = (tier: HeroOptionTier, label: string) => (
    <button
      type="button"
      aria-pressed={value === tier}
      disabled={disabled}
      onClick={() => value !== tier && onChange(tier)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
        value === tier
          ? tier === 'pro'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-800 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      {label}
    </button>
  )
  return (
    <div className="inline-flex shrink-0 gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
      {option('free', 'חינמי')}
      {option('pro', 'רק פרו')}
    </div>
  )
}

function TierGroup({
  title,
  rows,
  tiers,
  pending,
  onChange,
}: {
  title: string
  rows: Row[]
  tiers: HeroOptionTiers
  pending: boolean
  onChange: (key: HeroOptionKey, tier: HeroOptionTier) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70">
      <h3 className="border-b border-slate-200/70 bg-slate-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="divide-y divide-slate-200/70">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-500">{row.description}</p>
            </div>
            <TierSwitch value={tiers[row.key]} disabled={pending} onChange={(tier) => onChange(row.key, tier)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Free vs. PRO per hero layout and per hero option. Every switch saves
 * immediately and applies to every site on its next render: a free studio
 * whose saved hero uses something now PRO gets her theme's own hero back.
 */
export function HeroOptionTiersManager() {
  const [tiers, setTiers] = useState<HeroOptionTiers | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/admin/hero-option-tiers', { cache: 'no-store' })
      .then(async (res) => {
        const payload = (await res.json()) as { tiers?: HeroOptionTiers; error?: string }
        if (!active) return
        if (!res.ok || !payload.tiers) {
          setMessage(payload.error ?? 'טעינת הגדרות ההירו נכשלה')
          return
        }
        setTiers(payload.tiers)
      })
      .catch(() => active && setMessage('טעינת הגדרות ההירו נכשלה'))
    return () => {
      active = false
    }
  }, [])

  async function save(changes: { option_key: HeroOptionKey; tier: HeroOptionTier }[]) {
    if (!tiers) return
    const previous = tiers
    setTiers({ ...tiers, ...Object.fromEntries(changes.map((c) => [c.option_key, c.tier])) })
    setPending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/hero-option-tiers', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ changes }),
      })
      const payload = (await res.json()) as { tiers?: HeroOptionTiers; error?: string }
      if (!res.ok || !payload.tiers) {
        setTiers(previous)
        setMessage(payload.error ?? 'השמירה נכשלה')
        return
      }
      setTiers(payload.tiers)
    } catch {
      setTiers(previous)
      setMessage('השמירה נכשלה. נסי שוב.')
    } finally {
      setPending(false)
    }
  }

  const setAll = (tier: HeroOptionTier) => save(HERO_OPTION_KEYS.map((option_key) => ({ option_key, tier })))
  const resetToDefaults = () =>
    save(HERO_OPTION_KEYS.map((option_key) => ({ option_key, tier: DEFAULT_HERO_OPTION_TIERS[option_key] })))

  if (tiers === null) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600">
        {message ?? 'טוען הגדרות הירו…'}
      </div>
    )
  }

  const values = HERO_OPTION_KEYS.map((key) => tiers[key])
  const freeCount = values.filter((tier) => tier === 'free').length
  const freeLayouts = HERO_LAYOUT_IDS.filter((id) => tiers[layoutOptionKey(id)] === 'free').length

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-900">עיצוב הירו: חינמי או פרו</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            צלמת בחשבון חינמי רואה ומנסה הכל בתצוגה המקדימה, אבל יכולה לשמור רק אפשרויות חינמיות. השינוי כאן
            חל מיד על כל האתרים: צלמת חינמית שההירו השמור שלה כולל משהו שהפך לפרו חוזרת להירו של הערכה.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setAll('free')}>
            הכל חינמי
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setAll('pro')}>
            הכל פרו
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={resetToDefaults}>
            חזרה להגדרה המומלצת
          </Button>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600 tabular-nums">
        <b className="text-slate-900">{freeCount}</b> חינמיות · <b className="text-slate-900">{values.length - freeCount}</b>{' '}
        רק בפרו
        {freeLayouts === 0 ? ' · אין אף פריסה חינמית, צלמות חינמיות יכולות רק להישאר עם ההירו של הערכה' : ''}
      </p>

      {message ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}

      <div className="flex flex-col gap-4">
        <TierGroup title="פריסות" rows={LAYOUT_ROWS} tiers={tiers} pending={pending} onChange={(key, tier) => save([{ option_key: key, tier }])} />
        <TierGroup title="הגדרות" rows={FEATURE_ROWS} tiers={tiers} pending={pending} onChange={(key, tier) => save([{ option_key: key, tier }])} />
      </div>
    </section>
  )
}
