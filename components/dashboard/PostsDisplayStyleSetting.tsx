'use client'

import { useState, useTransition } from 'react'
import { Check, Circle, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { updatePostsDisplayStyle } from '@/lib/actions/post.actions'
import type { PostsDisplayStyle } from '@/lib/types/posts-display-style'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PostsDisplayStyleSettingProps = {
  initialStyle: PostsDisplayStyle
}

const STYLE_OPTIONS: {
  value: PostsDisplayStyle
  icon: typeof LayoutGrid
  title: string
  description: string
  isNew?: boolean
}[] = [
  {
    value: 'cards',
    icon: LayoutGrid,
    title: 'כרטיסים',
    description: 'כל פוסט מוצג ככרטיס עם תמונה, כותרת ותקציר — כמו היום.',
  },
  {
    value: 'circles',
    icon: Circle,
    title: 'עיגולים',
    description:
      'תמונות עגולות עם כותרת הפוסט מתחת. במעבר עכבר מופיעה תצוגה מקדימה.',
    isNew: true,
  },
]

export function PostsDisplayStyleSetting({
  initialStyle,
}: PostsDisplayStyleSettingProps) {
  const [style, setStyle] = useState(initialStyle)
  const [isPending, startTransition] = useTransition()

  function handleSelect(nextStyle: PostsDisplayStyle) {
    if (nextStyle === style || isPending) return

    startTransition(async () => {
      try {
        const updated = await updatePostsDisplayStyle(nextStyle)
        setStyle(updated)
        toast.success('סגנון תצוגת הפוסטים עודכן')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון')
      }
    })
  }

  return (
    <div className="space-y-4" role="radiogroup" aria-label="סגנון תצוגת פוסטים">
      <div className="grid gap-3 sm:grid-cols-2">
        {STYLE_OPTIONS.map((option) => {
          const Icon = option.icon
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
                'rounded-xl border-2 p-4 text-right transition-all',
                selected
                  ? 'border-[#7D3A52] bg-[#7D3A52]/5 shadow-sm'
                  : 'border-[--border]/80 bg-white/80 hover:border-[#7D3A52]/35',
                isPending && 'cursor-wait opacity-60'
              )}
            >
              <div className="flex flex-row-reverse items-start gap-3">
                <div
                  className={cn(
                    'shrink-0 rounded-lg p-2',
                    selected ? 'bg-[#7D3A52] text-white' : 'bg-[#7D3A52]/[0.08] text-[#7D3A52]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
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
                      <p className="font-semibold text-[--foreground]">{option.title}</p>
                    </div>
                    {option.isNew ? (
                      <Badge className="shrink-0 bg-[#7D3A52]">חדש!</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[--muted]">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {isPending ? (
        <p className="text-xs font-medium text-[#7D3A52]" role="status">
          שומרת את סגנון התצוגה...
        </p>
      ) : null}
    </div>
  )
}
