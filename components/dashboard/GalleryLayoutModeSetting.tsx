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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type GalleryLayoutModeSettingProps = {
  initialMode: GalleryLayoutMode
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

export function GalleryLayoutModeSetting({
  initialMode,
}: GalleryLayoutModeSettingProps) {
  const [mode, setMode] = useState<GalleryLayoutMode>(initialMode)
  const [isPending, startTransition] = useTransition()

  function handleSelect(nextMode: GalleryLayoutMode) {
    if (nextMode === mode || isPending) return

    startTransition(async () => {
      try {
        await updateGalleryLayoutMode(nextMode)
        setMode(nextMode)
        toast.success('מצב התצוגה עודכן בהצלחה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון')
        const current = await fetchGalleryLayoutMode()
        setMode(current)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מצב תצוגת גלריות באתר</CardTitle>
        <CardDescription>
          בחרו איך הגלריות יוצגו ללקוחות בעמוד הבית ובתפריט הניווט
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
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
                    : 'border-[#e8e4ea] hover:border-[#7D3A52]/40 bg-white',
                  isPending && 'opacity-60 cursor-wait'
                )}
              >
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div
                    className={cn(
                      'rounded-lg p-2 shrink-0',
                      selected ? 'bg-[#7D3A52] text-white' : 'bg-[#f5f3f6] text-[#7D3A52]'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#100d1f]">{option.title}</p>
                      {option.isNew ? (
                        <Badge variant="default" className="shrink-0">
                          חדש!
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[#6b6570] leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
