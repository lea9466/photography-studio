'use client'

import { useEffect, useState, useTransition } from 'react'
import { Album, AlertCircle, Check, Pencil, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { completeClientSelection } from '@/lib/actions/client-gallery.actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  selectionStorageKey,
  type ClientSelectionPayload,
} from '@/lib/gallery-selection'

const MAX_NOTE_LENGTH = 2000

const noteDraftKey = (galleryId: string) => `gallery-note-${galleryId}`

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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Keep the note across an accidental reload / re-login — the photo picks are
  // already persisted the same way (selectionStorageKey), so a dropped session
  // shouldn't cost the client their message either.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(noteDraftKey(galleryId))
      if (saved) setNote(saved)
    } catch {
      // ignore
    }
  }, [galleryId])

  function updateNote(value: string) {
    const next = value.slice(0, MAX_NOTE_LENGTH)
    setNote(next)
    try {
      if (next) sessionStorage.setItem(noteDraftKey(galleryId), next)
      else sessionStorage.removeItem(noteDraftKey(galleryId))
    } catch {
      // ignore
    }
  }

  function handleComplete() {
    setError(null)
    setSessionExpired(false)
    startTransition(async () => {
      let result
      try {
        result = await completeClientSelection(
          galleryId,
          selections,
          note.trim() || undefined
        )
      } catch {
        setError('משהו השתבש בשליחה. בדקו את החיבור לאינטרנט ונסו שוב.')
        return
      }

      if (!result.ok) {
        setError(result.error)
        if (result.expired) setSessionExpired(true)
        return
      }

      try {
        sessionStorage.removeItem(selectionStorageKey(galleryId))
        sessionStorage.removeItem(noteDraftKey(galleryId))
      } catch {
        // ignore
      }
      toast.success('הבחירה נשלחה לצלמת!')
      window.location.reload()
    })
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[--border] bg-white px-4 py-1.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 text-rose-500">
              <Album className="h-3.5 w-3.5" />
              לאלבום {albumCount}
              {maxAlbum != null ? `/${maxAlbum}` : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Pencil className="h-3.5 w-3.5" />
              לעיבוד {editCount}
              {maxEdit != null ? `/${maxEdit}` : ''}
            </span>
          </div>
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={isPending}>
            <Check className="h-3.5 w-3.5" />
            סיימתי לבחור ✓
          </Button>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isPending) setConfirmOpen(open)
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogTitle>לשלוח את הבחירה לצלמת?</DialogTitle>
          <DialogDescription className="text-[#48464c]">
            אחרי השליחה הבחירה עוברת לצלמת. אפשר להוסיף הודעה קצרה (לא חובה) — היא
            תגיע לצלמת יחד עם ההודעה על סיום הבחירה.
          </DialogDescription>

          <div className="mt-4 space-y-1.5">
            <label
              htmlFor="selection-note"
              className="block text-sm font-medium text-[#100d1f]"
            >
              הודעה לצלמת (אופציונלי)
            </label>
            <Textarea
              id="selection-note"
              value={note}
              onChange={(e) => updateNote(e.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              rows={4}
              disabled={isPending}
              placeholder="למשל: בחרתי שתי תמונות פחות כי אני רוצה פחות תמונות באלבום הסופי"
              className="bg-white border-[#c9c5cd] focus-visible:ring-[#7D3A52]"
            />
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              חזרה
            </Button>
            {sessionExpired ? (
              <Button type="button" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
                התחברות מחדש
              </Button>
            ) : (
              <Button type="button" onClick={handleComplete} disabled={isPending}>
                <Check className="h-4 w-4" />
                {isPending ? 'שולח...' : 'שליחת הבחירה'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
