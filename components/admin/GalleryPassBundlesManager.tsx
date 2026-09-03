'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BundleRow = {
  id: string
  code: string
  name: string
  photo_cap: number
  validity_days: number
  amount_agorot: number
  currency: string
  display_order: number
  is_active: boolean
}

type Editable = {
  photoCap: string
  validityDays: string
  priceShekels: string
  isActive: boolean
}

function toEditable(bundle: BundleRow): Editable {
  return {
    photoCap: String(bundle.photo_cap),
    validityDays: String(bundle.validity_days),
    priceShekels: (bundle.amount_agorot / 100).toString(),
    isActive: bundle.is_active,
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

export function GalleryPassBundlesManager() {
  const [bundles, setBundles] = useState<BundleRow[] | null>(null)
  const [edits, setEdits] = useState<Record<string, Editable>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/admin/gallery-pass-bundles', { cache: 'no-store' })
      .then(async (res) => {
        const payload = (await res.json()) as { bundles?: BundleRow[]; error?: string }
        if (!active) return
        if (!res.ok || !payload.bundles) {
          setMessage(payload.error ?? 'טעינת באנדלי הפאסים נכשלה')
          return
        }
        setBundles(payload.bundles)
        setEdits(Object.fromEntries(payload.bundles.map((b) => [b.id, toEditable(b)])))
      })
      .catch(() => active && setMessage('טעינת באנדלי הפאסים נכשלה'))
    return () => {
      active = false
    }
  }, [])

  function update(id: string, changes: Partial<Editable>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  async function save(bundle: BundleRow) {
    const edit = edits[bundle.id]
    if (!edit) return

    const photoCap = toPositiveInt(edit.photoCap)
    if (photoCap == null || Number.isNaN(photoCap)) {
      setMessage('נא להזין מספר תמונות תקין (מספר שלם חיובי)')
      return
    }
    const validityDays = toPositiveInt(edit.validityDays)
    if (validityDays == null || Number.isNaN(validityDays)) {
      setMessage('נא להזין מספר ימי תוקף תקין (מספר שלם חיובי)')
      return
    }
    const amountAgorot = shekelsToAgorot(edit.priceShekels)
    if (amountAgorot == null || Number.isNaN(amountAgorot)) {
      setMessage('נא להזין מחיר תקין (מספר חיובי)')
      return
    }

    setSavingId(bundle.id)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/gallery-pass-bundles', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: bundle.id,
          patch: {
            photo_cap: photoCap,
            validity_days: validityDays,
            amount_agorot: amountAgorot,
            is_active: edit.isActive,
          },
        }),
      })
      const payload = (await res.json()) as { bundle?: BundleRow; error?: string }
      if (!res.ok || !payload.bundle) {
        setMessage(payload.error ?? 'השמירה נכשלה')
        return
      }
      setBundles((prev) =>
        prev ? prev.map((b) => (b.id === bundle.id ? payload.bundle! : b)) : prev
      )
      setMessage('הבאנדל עודכן בהצלחה.')
    } catch {
      setMessage('השמירה נכשלה. נסי שוב.')
    } finally {
      setSavingId(null)
    }
  }

  if (bundles === null) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600">
        טוען באנדלי פאסים…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">פאסים לגלריה בודדת</h2>
        <p className="mt-1 text-sm text-slate-600">
          רכישה חד-פעמית לגלריית לקוח אחת, ללא מנוי. מספר התמונות (רגילות + מעובדות),
          משך החלון ללקוח, והמחיר — משפיע מיידית על הרכישה, בלי דיפלוי.
        </p>
      </div>

      <div className="space-y-4">
        {bundles.map((bundle) => {
          const edit = edits[bundle.id]
          if (!edit) return null
          return (
            <div key={bundle.id} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{bundle.name}</p>
                  <p className="text-xs text-slate-500">{bundle.code}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={edit.isActive}
                    onChange={(e) => update(bundle.id, { isActive: e.target.checked })}
                  />
                  פעיל
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  <span className="block text-slate-600">מקסימום תמונות (רגילות + מעובדות)</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={edit.photoCap}
                    onChange={(e) => update(bundle.id, { photoCap: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">ימי תוקף ללקוח (מרגע השליחה)</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={edit.validityDays}
                    onChange={(e) => update(bundle.id, { validityDays: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">מחיר ({bundle.currency}, חד-פעמי)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.priceShekels}
                    onChange={(e) => update(bundle.id, { priceShekels: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center">
                <Button
                  type="button"
                  className="ms-auto"
                  disabled={Boolean(savingId)}
                  onClick={() => save(bundle)}
                >
                  {savingId === bundle.id ? (
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
