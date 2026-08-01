'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { updateBeforeAfterDisplayStyle } from '@/lib/actions/photo-edit-comparisons.actions'
import type { BeforeAfterDisplayStyle } from '@/lib/types/before-after-display-style'
import { cn } from '@/lib/utils'

type BeforeAfterDisplayStyleSettingProps = {
  initialStyle: BeforeAfterDisplayStyle
}

const STYLE_OPTIONS: {
  value: BeforeAfterDisplayStyle
  title: string
  description: string
}[] = [
  {
    value: 'development',
    title: 'עדשת השוואה',
    description: 'הזיזו את הסמן על התמונה כדי לחשוף את התמונה המקורית.',
  },
  {
    value: 'split_slider',
    title: 'סליידר קלאסי',
    description: 'גררו את המחיצה כדי להשוות בין התמונה המקורית לתוצאה הסופית.',
  },
]

export function BeforeAfterDisplayStyleSetting({
  initialStyle,
}: BeforeAfterDisplayStyleSettingProps) {
  const [style, setStyle] = useState(initialStyle)
  const [isPending, startTransition] = useTransition()

  function handleSelect(nextStyle: BeforeAfterDisplayStyle) {
    if (nextStyle === style || isPending) return

    startTransition(async () => {
      const result = await updateBeforeAfterDisplayStyle(nextStyle)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setStyle(result.data ?? nextStyle)
      toast.success('סגנון התצוגה עודכן בהצלחה')
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-[--border] bg-[--dashboard-surface] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[--foreground]">סגנון תצוגה באתר</h2>
        <p className="mt-1 text-sm text-[--muted]">
          בחרי כיצד יוצגו כל זוגות התמונות בעמוד לפני ואחרי.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="סגנון תצוגה באתר">
        {STYLE_OPTIONS.map((option) => {
          const selected = style === option.value

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isPending}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'cursor-pointer rounded-xl border-2 p-4 text-right transition-all',
                selected
                  ? 'border-[#7D3A52] bg-[#7D3A52]/5'
                  : 'border-[--border] hover:border-[#7D3A52]/50',
                isPending && 'cursor-wait opacity-60'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    selected
                      ? 'border-[#7D3A52] bg-[#7D3A52] text-white'
                      : 'border-[--border] text-transparent'
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="font-medium text-[--foreground]">{option.title}</span>
              </div>
              <p className="mt-2 pr-7 text-xs leading-relaxed text-[--muted]">
                {option.description}
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-[--muted]">
        הסגנון שתבחרי יחול על כל זוגות התמונות בעמוד.
      </p>
      {isPending ? (
        <p className="text-xs font-medium text-[#7D3A52]" role="status">
          שומרת את סגנון התצוגה...
        </p>
      ) : null}
    </section>
  )
}
