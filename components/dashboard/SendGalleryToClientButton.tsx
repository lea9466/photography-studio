'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check } from 'lucide-react'
import { toast } from 'sonner'
import { sendGallery, resendGalleryEmail } from '@/lib/actions/gallery.actions'
import { Button } from '@/components/ui/button'
import { SendGalleryConfirmDialog } from '@/components/dashboard/SendGalleryConfirmDialog'
import type { GalleryStatus } from '@/lib/types/database.types'

type SendGalleryToClientButtonProps = {
  galleryId: string
  status: GalleryStatus
}

/**
 * Sends the client-gallery invite email — placed on the photo-upload screen so
 * it's used AFTER photos are uploaded, not at creation time.
 * `draft` → first send (behind a confirm — the send freezes the album);
 * once sent (`selection`+) → resend.
 * Rendered inside a floating bar on the upload screen (see the photos page), so
 * both states stay on a single row and compact.
 */
export function SendGalleryToClientButton({ galleryId, status }: SendGalleryToClientButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
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
          onClick={() => run(() => resendGalleryEmail(galleryId), 'המייל נשלח שוב ללקוח')}
          className="border-[#c9c5cd] hover:bg-[#f7f2f4]"
        >
          {isPending ? 'שולח...' : 'שלח שוב'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        className="bg-[#6b2d43] text-white hover:bg-[#5a2538]"
      >
        <Send className="ml-2 h-4 w-4" />
        {isPending ? 'שולח...' : 'שלח ללקוח מייל לבחירת תמונות'}
      </Button>

      <SendGalleryConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pending={isPending}
        onConfirm={() => {
          setConfirmOpen(false)
          run(() => sendGallery(galleryId), 'הגלריה נשלחה ללקוח')
        }}
      />
    </>
  )
}
