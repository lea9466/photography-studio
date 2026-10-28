'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { sendGallery, resendGalleryEmail } from '@/lib/actions/gallery.actions'
import { markDeliveryReady } from '@/lib/actions/client-gallery.actions'
import { Button } from '@/components/ui/button'
import { SendGalleryConfirmDialog } from '@/components/dashboard/SendGalleryConfirmDialog'
import {
  CLIENT_NOTE_HINT,
  ClientEmailDialog,
  ClientNoteIcon,
} from '@/components/dashboard/ClientEmailDialog'
import type { GalleryStatus } from '@/lib/types/database.types'

type SendGalleryToClientButtonProps = {
  galleryId: string
  status: GalleryStatus
}

/**
 * Sends the client-gallery invite email — placed on the photo-upload screen so
 * it's used AFTER photos are uploaded, not at creation time.
 * `draft` → first send (behind a confirm — the send freezes the album);
 * `editing` (client finished choosing) → send the processed photos, since this
 * is the screen she uploads them on; otherwise once sent → resend.
 * Rendered inside a floating bar on the upload screen (see the photos page), so
 * both states stay on a single row and compact.
 */
export function SendGalleryToClientButton({ galleryId, status }: SendGalleryToClientButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resendOpen, setResendOpen] = useState(false)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const alreadySent = status !== 'draft'

  function run(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  if (status === 'editing') {
    return (
      <>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => setDeliveryOpen(true)}
          title={CLIENT_NOTE_HINT}
          className="bg-[#6b2d43] text-white hover:bg-[#5a2538]"
        >
          <Truck className="ml-2 h-4 w-4" />
          {isPending ? 'שולח...' : 'שלח ללקוח מייל עם תמונות מעובדות'}
          <ClientNoteIcon />
        </Button>

        <ClientEmailDialog
          open={deliveryOpen}
          onOpenChange={setDeliveryOpen}
          pending={isPending}
          title="לשלוח ללקוח את התמונות המעובדות?"
          description="ודאי שכל התמונות המעובדות הועלו."
          confirmLabel="שלח"
          onConfirm={(note) => {
            setDeliveryOpen(false)
            run(() => markDeliveryReady(galleryId, note), 'התמונות המעובדות נשלחו ללקוח')
          }}
        />
      </>
    )
  }

  if (alreadySent) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#48464c]">
          <Check className="h-4 w-4 text-emerald-600" />
          המייל נשלח ללקוח
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setResendOpen(true)}
          title={CLIENT_NOTE_HINT}
          className="border-[#c9c5cd] hover:bg-[#f7f2f4]"
        >
          {isPending ? 'שולח...' : 'שלח שוב'}
          <ClientNoteIcon />
        </Button>

        <ClientEmailDialog
          open={resendOpen}
          onOpenChange={setResendOpen}
          pending={isPending}
          title="לשלוח שוב את המייל ללקוח?"
          confirmLabel="שלח שוב"
          onConfirm={(note) => {
            setResendOpen(false)
            run(() => resendGalleryEmail(galleryId, note), 'המייל נשלח שוב ללקוח')
          }}
        />
      </div>
    )
  }

  return (
    <>
      <Button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        title={CLIENT_NOTE_HINT}
        className="bg-[#6b2d43] text-white hover:bg-[#5a2538]"
      >
        <Send className="ml-2 h-4 w-4" />
        {isPending ? 'שולח...' : 'שלח ללקוח מייל לבחירת תמונות'}
        <ClientNoteIcon />
      </Button>

      <SendGalleryConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pending={isPending}
        onConfirm={(note) => {
          setConfirmOpen(false)
          run(() => sendGallery(galleryId, note), 'הגלריה נשלחה ללקוח')
        }}
      />
    </>
  )
}
