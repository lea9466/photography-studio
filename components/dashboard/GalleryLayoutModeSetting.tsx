'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, Images } from 'lucide-react'
import {
  fetchGalleryLayoutMode,
  updateGalleryLayoutMode,
} from '@/lib/actions/gallery.actions'
import type { GalleryLayoutMode } from '@/lib/types/database.types'
import { GALLERY_LAYOUT_MODE_LABELS } from '@/lib/types/app.types'
import { Badge } from '@/components/ui/badge'
import { GalleriesDashboardNote } from '@/components/dashboard/GalleriesDashboardNote'
import { cn } from '@/lib/utils'

type GalleryLayoutModeSettingProps = {
  initialMode: GalleryLayoutMode
  onModeChange?: (mode: GalleryLayoutMode) => void
}

const MODE_OPTIONS: {
  value: GalleryLayoutMode
  icon: typeof LayoutGrid
  title: string
  description: string
  isNew?: boolean
}[] = [
  {
    value: 'separated',
    icon: LayoutGrid,
    title: GALLERY_LAYOUT_MODE_LABELS.separated,
    description:
      'כל גלריה מוצגת ככרטיס נפרד בעמוד הבית — כמו שזה עובד היום.',
  },
  {
    value: 'portfolio',
    icon: Images,
    title: GALLERY_LAYOUT_MODE_LABELS.portfolio,
    description:
      'כל הגלריות מוצגות בעמוד תיק עבודות אחד, עם לשוניות לפי שם הגלריה (למשל: ניו בורן, משפחה).',
    isNew: true,
  },
]

function GalleriesSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

function GalleriesSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof LayoutGrid
  title: string
  description?: string
  index?: number
}) {
  return (
    <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {index !== undefined ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                {index}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[--muted]">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function GalleryLayoutModeSetting({
  initialMode,
  onModeChange,
}: GalleryLayoutModeSettingProps) {
  const [mode, setMode] = useState<GalleryLayoutMode>(initialMode)
  const [isPending, startTransition] = useTransition()

  function handleSelect(nextMode: GalleryLayoutMode) {
    if (nextMode === mode || isPending) return

    startTransition(async () => {
      try {
        await updateGalleryLayoutMode(nextMode)
        setMode(nextMode)
        onModeChange?.(nextMode)
        toast.success('מצב התצוגה עודכן בהצלחה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון')
        const current = await fetchGalleryLayoutMode()
        setMode(current)
      }
    })
  }

  return (
    <GalleriesSection>
      <GalleriesSectionHeader
        index={1}
        icon={LayoutGrid}
        title="מצב תצוגת גלריות באתר"
        description="בחרו איך הגלריות יוצגו ללקוחות בעמוד הבית ובתפריט הניווט"
        
      />

      <GalleriesDashboardNote>
        <p>
          <span className="font-semibold">גלריות ציבוריות:</span> ניתן לסמן עד 4 גלריות כציבוריות,
          ויש שני מצבי תצוגה:
        </p>
        <ul className="list-disc space-y-1 pr-5">
          <li>
            <span className="font-medium">מצב מופרד</span> — 4 כרטיסי גלריה בדף הבית
          </li>
          <li>
            <span className="font-medium">מצב תיק עבודות</span> — קישור לדף נפרד, שבו הגלריות
            מוצגות לפי לשוניות
          </li>
        </ul>
        <p>
          בשני המצבים יש גם סקשן &quot;תמונות אחרונות&quot; בדף הבית — מכל גלריה מוצגות 4
          תמונות, סה&quot;כ 16 מהכל יחד.
        </p>
      </GalleriesDashboardNote>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = mode === option.value

          return (
            <button
              key={option.value}
              type="button"
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
                    <p className="font-semibold text-[--foreground]">{option.title}</p>
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
      
    </GalleriesSection>
  )
}
