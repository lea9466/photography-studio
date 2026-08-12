'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PlanRow = {
  id: string
  code: string
  name: string
  amount_agorot: number
  currency: string
  billing_interval: 'month' | 'year'
  compare_at_amount_agorot: number | null
  badge: string | null
  is_highlighted: boolean
}

type Editable = {
  name: string
  amountShekels: string
  compareShekels: string
  badge: string
  isHighlighted: boolean
}

function toEditable(plan: PlanRow): Editable {
  return {
    name: plan.name,
    amountShekels: (plan.amount_agorot / 100).toString(),
    compareShekels:
      plan.compare_at_amount_agorot == null
        ? ''
        : (plan.compare_at_amount_agorot / 100).toString(),
    badge: plan.badge ?? '',
    isHighlighted: plan.is_highlighted,
  }
}

function shekelsToAgorot(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const number = Number(trimmed)
  if (!Number.isFinite(number) || number <= 0) return NaN
  return Math.round(number * 100)
}

export function PlanPricingManager() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null)
  const [edits, setEdits] = useState<Record<string, Editable>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/admin/plans', { cache: 'no-store' })
      .then(async (res) => {
        const payload = (await res.json()) as { plans?: PlanRow[]; error?: string }
        if (!active) return
        if (!res.ok || !payload.plans) {
          setMessage(payload.error ?? 'טעינת התוכניות נכשלה')
          return
        }
        setPlans(payload.plans)
        setEdits(
          Object.fromEntries(payload.plans.map((plan) => [plan.id, toEditable(plan)]))
        )
      })
      .catch(() => active && setMessage('טעינת התוכניות נכשלה'))
    return () => {
      active = false
    }
  }, [])

  function update(id: string, changes: Partial<Editable>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  async function save(plan: PlanRow) {
    const edit = edits[plan.id]
    if (!edit) return
    const amountAgorot = shekelsToAgorot(edit.amountShekels)
    if (amountAgorot == null || Number.isNaN(amountAgorot)) {
      setMessage('נא להזין מחיר תקין (מספר חיובי)')
      return
    }
    const compareAgorot = edit.compareShekels.trim() === '' ? null : shekelsToAgorot(edit.compareShekels)
    if (compareAgorot != null && Number.isNaN(compareAgorot)) {
      setMessage('מחיר ההשוואה חייב להיות מספר חיובי')
      return
    }

    setSavingId(plan.id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          patch: {
            name: edit.name,
            amount_agorot: amountAgorot,
            compare_at_amount_agorot: compareAgorot,
            badge: edit.badge,
            is_highlighted: edit.isHighlighted,
          },
        }),
      })
      const payload = (await response.json()) as { plan?: PlanRow; error?: string }
      if (!response.ok || !payload.plan) {
        setMessage(payload.error ?? 'השמירה נכשלה')
        return
      }
      setPlans((prev) =>
        prev ? prev.map((p) => (p.id === plan.id ? payload.plan! : p)) : prev
      )
      setEdits((prev) => ({ ...prev, [plan.id]: toEditable(payload.plan!) }))
      setMessage('המחירים עודכנו בהצלחה.')
    } catch {
      setMessage('השמירה נכשלה. נסי שוב.')
    } finally {
      setSavingId(null)
    }
  }

  if (plans === null) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600">
        טוען תוכניות מינוי…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">מחירי מנויים</h2>
        <p className="mt-1 text-sm text-slate-600">
          המחיר שנגבה בפועל הוא שדה המחיר; שדה &quot;מחיר הצגה (מחיר מקורי)&quot; מוצג בקו חוצה
          לצד ההנחה. שדה התגית מציג תווית קצרה (למשל &quot;מחיר השקה מיוחד&quot;).
        </p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const edit = edits[plan.id]
          if (!edit) return null
          return (
            <div
              key={plan.id}
              className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{plan.code}</p>
                  <p className="text-xs text-slate-500">
                    {plan.billing_interval === 'year' ? 'חיוב שנתי' : 'חיוב חודשי'}
                  </p>
                </div>
                {edit.isHighlighted ? (
                  <span className="rounded-full bg-[#7D3A52]/10 px-3 py-1 text-xs font-semibold text-[#7D3A52]">
                    מודגש
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="block text-slate-600">שם התוכנית</span>
                  <input
                    type="text"
                    value={edit.name}
                    onChange={(e) => update(plan.id, { name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">תגית (Badge)</span>
                  <input
                    type="text"
                    value={edit.badge}
                    placeholder="למשל: מחיר השקה מיוחד"
                    onChange={(e) => update(plan.id, { badge: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">מחיר לחיוב (₪)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.amountShekels}
                    onChange={(e) => update(plan.id, { amountShekels: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-slate-600">מחיר הצגה / מקורי (₪, אופציונלי)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.compareShekels}
                    placeholder="למשל: 40"
                    onChange={(e) => update(plan.id, { compareShekels: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={edit.isHighlighted}
                    onChange={(e) => update(plan.id, { isHighlighted: e.target.checked })}
                    className="h-4 w-4"
                  />
                  הדגשת הכרטיס במסך הבחירה
                </label>
                <Button
                  type="button"
                  className="ms-auto"
                  disabled={Boolean(savingId)}
                  onClick={() => save(plan)}
                >
                  {savingId === plan.id ? (
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
