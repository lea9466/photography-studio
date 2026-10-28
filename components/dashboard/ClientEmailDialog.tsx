'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CLIENT_NOTE_MAX_LENGTH } from '@/lib/private-galleries/client-note-limits'

/** Tooltip for every button that opens this dialog. */
export const CLIENT_NOTE_HINT = 'אפשר לצרף הערה אישית ללקוח'

/**
 * Small speech-bubble icon placed inside every client-email button, so the
 * photographer sees before clicking that a personal note can go with it.
 */
export function ClientNoteIcon() {
  return <MessageSquareText className="h-3.5 w-3.5 opacity-70" aria-hidden />
}

type ClientEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the (possibly empty) personal note for the client. */
  onConfirm: (clientNote: string) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  pending?: boolean
}

/**
 * Shown before every email the photographer sends a client (first send,
 * resend, processed photos ready). Carries an optional personal note that goes
 * into that one email only — it is never stored.
 */
export function ClientEmailDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  pending,
}: ClientEmailDialogProps) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) setNote('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription className="mt-2 leading-relaxed">{description}</DialogDescription>
        ) : null}

        <label className="mt-5 block space-y-1.5">
          <span className="text-sm font-semibold text-[#100d1f]">
            הערה ללקוח <span className="font-normal text-[#6b6575]">(לא חובה)</span>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={CLIENT_NOTE_MAX_LENGTH}
            rows={3}
            placeholder="למשל: היה כיף לצלם אתכם! בחרו עד 30 תמונות לאלבום 🙂"
            className="w-full resize-y rounded-lg border border-[#c9c5cd] bg-white px-3 py-2 text-sm leading-relaxed focus:border-[#6b2d43] focus:outline-none focus:ring-1 focus:ring-[#6b2d43]"
          />
          <span className="block text-xs text-[#6b6575]">תצורף למייל הזה בלבד</span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => onConfirm(note)}
            className="bg-[#6b2d43] text-white hover:bg-[#5a2538]"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
