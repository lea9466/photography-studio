'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TierRow = {
  id: string
  tier: 'free' | 'starter' | 'pro' | 'unlimited'
  max_galleries: number
  max_photos_per_gallery: number
  is_lifetime_cap: boolean
  plan: { id: string; code: string; name: string; amount_agorot: number; currency: string } | null
}

type Editable = {
  maxGalleries: string
  maxPhotosPerGallery: string
  priceShekels: string
}

const TIER_LABELS: Record<TierRow['tier'], string> = {
  free: 'חינם',
  starter: 'Starter',
  pro: 'Pro',
  unlimited: 'Unlimited',
}

function toEditable(tier: TierRow): Editable {
  return {
    maxGalleries: String(tier.max_galleries),
    maxPhotosPerGallery: String(tier.max_photos_per_gallery),
    priceShekels: tier.plan ? (tier.plan.amount_agorot / 100).toString() : '',
  }
}

function toPositiveInt(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const number = Number(trimmed)
  if (!Number.isFinite(number) || number <= 0) return NaN
  return Math.round(number)
}

function shekelsToAgorot(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const number = Number(trimmed)
  if (!Number.isFinite(number) || number <= 0) return NaN
  return Math.round(number * 100)
}

export function PrivateGalleryTiersManager() {
  const [tiers, setTiers] = useState<TierRow[] | null>(null)
  const [edits, setEdits] = useState<Record<string, Editable>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/admin/private-gallery-tiers', { cache: 'no-store' })
      .then(async (res) => {
        const payload = (await res.json()) as { tiers?: TierRow[]; error?: string }
        if (!active) return
        if (!res.ok || !payload.tiers) {
          setMessage(payload.error ?? 'טעינת מסלולי הגלריות הפרטיות נכשלה')
          return
        }
        setTiers(payload.tiers)
        setEdits(Object.fromEntries(payload.tiers.map((tier) => [tier.id, toEditable(tier)])))
      })
      .catch(() => active && setMessage('טעינת מסלולי הגלריות הפרטיות נכשלה'))
    return () => {
      active = false
    }
  }, [])

  function update(id: string, changes: Partial<Editable>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  async function save(tier: TierRow) {
    const edit = edits[tier.id]
    if (!edit) return
    const maxGalleries = toPositiveInt(edit.maxGalleries)
    if (maxGalleries == null || Number.isNaN(maxGalleries)) {
      setMessage('נא להזין מספר גלריות תקין (מספר שלם חיובי)')
      return
    }
    const maxPhotosPerGallery = toPositiveInt(edit.maxPhotosPerGallery)
    if (maxPhotosPerGallery == null || Number.isNaN(maxPhotosPerGallery)) {
      setMessage('נא להזין מספר תמונות תקין (מספר שלם חיובי)')
      return
    }
    let amountAgorot: number | null = null
    if (tier.plan) {
      amountAgorot = shekelsToAgorot(edit.priceShekels)
      if (amountAgorot == null || Number.isNaN(amountAgorot)) {
        setMessage('נא להזין מחיר תקין (מספר חיובי)')
        return
      }
    }

    setSavingId(tier.id)
    setMessage(null)
    try {
      const [tiersResponse, planResponse] = await Promise.all([
        fetch('/api/admin/private-gallery-tiers', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: tier.id,
            patch: { max_galleries: maxGalleries, max_photos_per_gallery: maxPhotosPerGallery },
          }),
        }),
        tier.plan && amountAgorot != null
          ? fetch('/api/admin/plans', {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ id: tier.plan.id, patch: { amount_agorot: amountAgorot } }),
            })
          : Promise.resolve(null),
      ])

      const tiersPayload = (await tiersResponse.json()) as { tier?: TierRow; error?: string }
      if (!tiersResponse.ok || !tiersPayload.tier) {
        setMessage(tiersPayload.error ?? 'השמירה נכשלה')
        return
      }

      let updatedPlan = tier.plan
      if (planResponse) {
        const planPayload = (await planResponse.json()) as {
          plan?: { id: string; code: string; name: string; amount_agorot: number; currency: string }
          error?: string
        }
        if (!planResponse.ok || !planPayload.plan) {
          setMessage(planPayload.error ?? 'עדכון המחיר נכשל')
          return
        }
        updatedPlan = planPayload.plan
      }

      setTiers((prev) =>
        prev
          ? prev.map((t) => (t.id === tier.id ? { ...t, ...tiersPayload.tier!, plan: updatedPlan } : t))
          : prev
      )
      setMessage('המכסות עודכנו בהצלחה.')
    } catch {
      setMessage('השמירה נכשלה. נסי שוב.')
    } finally {
      setSavingId(null)
    }
  }

  if (tiers === null) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600">
        טוען מסלולי גלריות פרטיות…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">מכסות גלריות פרטיות</h2>
        <p className="mt-1 text-sm text-slate-600">
          מספר הגלריות הפעילות, מספר התמונות לגלריה, והמחיר החודשי לכל מסלול — משפיע מיידית על
          האכיפה ועל התצוגה בדשבורד, בלי דיפלוי.
        </p>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => {
          const edit = edits[tier.id]
          if (!edit) return null
          return (
            <div key={tier.id} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{TIER_LABELS[tier.tier]}</p>
                  <p className="text-xs text-slate-500">
                    {tier.is_lifetime_cap
                      ? 'מכסה חד-פעמית לכל החיים (לא במקביל)'
                      : 'מכסה של גלריות קיימות במקביל'}
                    {!tier.plan ? ' · ללא תשלום' : null}
                  </p>
                </div>
              </div>

              <div className={`grid gap-3 ${tier.plan ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <label className="text-sm">
                  <span className="block text-slate-600">
                    {tier.is_lifetime_cap ? 'מספר גלריות (לכל החיים)' : 'מקסימום גלריות במקביל'}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={edit.maxGalleries}
                    onChange={(e) => update(tier.id, { maxGalleries: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">מקסימום תמונות לגלריה</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={edit.maxPhotosPerGallery}
                    onChange={(e) => update(tier.id, { maxPhotosPerGallery: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                {tier.plan ? (
                  <label className="text-sm">
                    <span className="block text-slate-600">מחיר לחודש (₪)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={edit.priceShekels}
                      onChange={(e) => update(tier.id, { priceShekels: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>
                ) : null}
              </div>

              <div className="mt-3 flex items-center">
                <Button
                  type="button"
                  className="ms-auto"
                  disabled={Boolean(savingId)}
                  onClick={() => save(tier)}
                >
                  {savingId === tier.id ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="ml-2 h-4 w-4" />
                  )}
                  שמירה
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
    </section>
  )
}
