'use client'

import { useTransition } from 'react'
import { Check, Heart, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { completeClientSelection } from '@/lib/actions/client-gallery.actions'
import { Button } from '@/components/ui/button'
import {
  selectionStorageKey,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'

type SelectionBarProps = {
  galleryId: string
  albumCount: number
  editCount: number
  maxAlbum?: number | null
  maxEdit?: number | null
  selections: ClientSelectionPayload[]
}

export function SelectionBar({
  galleryId,
  albumCount,
  editCount,
  maxAlbum,
  maxEdit,
  selections,
}: SelectionBarProps) {
  const [isPending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      try {
        await completeClientSelection(galleryId, selections)
        try {
          sessionStorage.removeItem(selectionStorageKey(galleryId))
        } catch {
          // ignore
        }
        toast.success('הבחירה נשלחה לצלמת!')
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[--border] bg-white px-4 py-1.5">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1 text-rose-500">
            <Heart className="h-3.5 w-3.5 fill-rose-500" />
            {albumCount}
            {maxAlbum != null ? `/${maxAlbum}` : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400">
            <Sparkles className="h-3.5 w-3.5 fill-amber-400" />
            {editCount}
            {maxEdit != null ? `/${maxEdit}` : ''}
          </span>
        </div>
        <Button size="sm" onClick={handleComplete} disabled={isPending}>
          <Check className="h-3.5 w-3.5" />
          {isPending ? 'שולח...' : 'סיימתי לבחור ✓'}
        </Button>
      </div>
    </div>
  )
}
