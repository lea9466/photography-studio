'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, SearchX } from 'lucide-react'
import { updateHideFromSearch } from '@/lib/actions/site-settings.actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type SearchVisibilitySettingProps = {
  initialHidden: boolean
}

export function SearchVisibilitySetting({ initialHidden }: SearchVisibilitySettingProps) {
  const [hidden, setHidden] = useState(initialHidden)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !hidden
    startTransition(async () => {
      const result = await updateHideFromSearch(next)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setHidden(result.hide_from_search)
      toast.success(
        next
          ? 'האתר יוסר מגוגל — ההסרה מתעדכנת אצל גוגל תוך כמה ימים עד שבועות'
          : 'האתר יחזור לגוגל — החזרה מתעדכנת אצל גוגל תוך כמה ימים עד שבועות'
      )
    })
  }

  return (
    <section className="relative space-y-5 overflow-hidden rounded-2xl border border-(--border)/80 bg-(--dashboard-surface) p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            {hidden ? <SearchX className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-(--foreground)">הופעה בחיפוש של גוגל</h2>
            <p className="text-xs leading-relaxed text-(--muted)">
              אפשר להוריד את האתר מתוצאות החיפוש של גוגל בלי לסגור אותו — כל מי שיש לו את
              הקישור ימשיך להיכנס כרגיל. השינוי מתעדכן אצל גוגל בסריקה הבאה שלו, בדרך כלל תוך
              כמה ימים עד כמה שבועות.
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
          hidden ? 'border-orange-200 bg-orange-50/70' : 'border-(--border)/80 bg-white/80'
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-(--foreground)">
            {hidden ? 'האתר לא מופיע בגוגל' : 'האתר מופיע בגוגל'}
          </p>
          <p className="text-xs leading-relaxed text-(--muted)">
            {hidden
              ? 'גוגל מתבקש לא להציג את האתר, הגלריות והבלוג שלך בתוצאות החיפוש.'
              : 'גוגל יכול למצוא ולהציג את האתר שלך בתוצאות החיפוש.'}
          </p>
        </div>
        <Button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          variant="outline"
          className={cn(
            'shrink-0',
            hidden
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100'
          )}
        >
          {isPending ? 'מעדכן...' : hidden ? 'החזירי את האתר לגוגל' : 'הסירי את האתר מגוגל'}
        </Button>
      </div>
    </section>
  )
}
