'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { Archive, ExternalLink, Mail, Send, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  archiveGallery,
  resendGalleryEmail,
  sendGallery,
  updateGalleryStatus,
} from '@/lib/actions/gallery.actions'
import { markDeliveryReady } from '@/lib/actions/client-gallery.actions'
import type { GalleryStatus, GalleryType } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'

type GalleryActionsProps = {
  galleryId: string
  status: GalleryStatus
  galleryType: GalleryType
  clientLink: string
}

function resendEmailLabel(status: GalleryStatus): string | null {
  if (['sent', 'selection', 'editing'].includes(status)) {
    return 'שלחו שוב מייל גלריה ללקוח'
  }
  if (['delivery_ready', 'locked'].includes(status)) {
    return 'שלחו שוב מייל תמונות מעובדות'
  }
  return null
}

function resendSuccessMessage(status: GalleryStatus): string {
  if (['delivery_ready', 'locked'].includes(status)) {
    return 'מייל התמונות המעובדות נשלח שוב ללקוח'
  }
  return 'מייל הגלריה נשלח שוב ללקוח'
}

export function GalleryActions({
  galleryId,
  status,
  galleryType,
  clientLink,
}: GalleryActionsProps) {
  const [isPending, startTransition] = useTransition()
  const resendLabel = galleryType !== 'portfolio' ? resendEmailLabel(status) : null

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={clientLink} target="_blank">
          <ExternalLink className="h-4 w-4" />
          {clientLink.startsWith('/portfolio') ? 'תצוגה ציבורית' : 'תצוגת לקוח'}
        </Link>
      </Button>

      {status === 'draft' ? (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() => sendGallery(galleryId), 'הגלריה נשלחה ללקוח')
          }
        >
          <Send className="h-4 w-4" />
          שלח ללקוח
        </Button>
      ) : null}

      {resendLabel ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(
              () => resendGalleryEmail(galleryId),
              resendSuccessMessage(status)
            )
          }
        >
          <Mail className="h-4 w-4" />
          {resendLabel}
        </Button>
      ) : null}

      {status === 'editing' ? (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() => markDeliveryReady(galleryId), 'הגלריה מוכנה למסירה')
          }
        >
          <Truck className="h-4 w-4" />
          סמן מוכן למסירה
        </Button>
      ) : null}

      {status !== 'locked' ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() => archiveGallery(galleryId), 'הגלריה הועברה לארכיב')
          }
        >
          <Archive className="h-4 w-4" />
          ארכיב
        </Button>
      ) : null}

      {status === 'sent' ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(
              () => updateGalleryStatus(galleryId, 'selection'),
              'מצב בחירה נפתח'
            )
          }
        >
          פתח בחירה
        </Button>
      ) : null}
    </div>
  )
}
