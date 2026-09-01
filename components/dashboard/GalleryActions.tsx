'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { ExternalLink, Mail, Send, Truck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  resendGalleryEmail,
  sendGallery,
  updateGalleryStatus,
} from '@/lib/actions/gallery.actions'
import { markDeliveryReady } from '@/lib/actions/client-gallery.actions'
import { DeleteGalleryButton } from '@/components/dashboard/DeleteGalleryButton'
import {
  CLIENT_GALLERY_STATUSES,
  GALLERY_STATUS_LABELS,
  PUBLIC_ONLY_MVP,
} from '@/lib/types/app.types'
import type { GalleryStatus, GalleryType } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

type GalleryActionsProps = {
  galleryId: string
  galleryTitle: string
  status: GalleryStatus
  galleryType: GalleryType
  clientLink: string
  /** Per-account override, computed server-side — see isMvpBypassUser. */
  publicOnlyMvp?: boolean
}

function resendEmailLabel(status: GalleryStatus): string | null {
  if (['selection', 'editing'].includes(status)) {
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
  galleryTitle,
  status,
  galleryType,
  clientLink,
  publicOnlyMvp: publicOnlyMvpProp,
}: GalleryActionsProps) {
  const publicOnlyMvp = publicOnlyMvpProp ?? PUBLIC_ONLY_MVP
  const [isPending, startTransition] = useTransition()
  const resendLabel = galleryType !== 'portfolio' ? resendEmailLabel(status) : null
  const canSendToClient = galleryType !== 'portfolio' && status === 'draft'
  // A client gallery moves through the delivery workflow and is never "public";
  // a portfolio gallery only has the one public state.
  const statusOptions: GalleryStatus[] =
    galleryType === 'portfolio' ? ['public'] : CLIENT_GALLERY_STATUSES

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
    <Card className="border-[#c9c5cd] shadow-sm">
      <CardContent className="p-6 space-y-6">
        {/* Section: Client Communication */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#48464c]">תקשורת עם לקוח</h3>
          <div className="flex flex-wrap gap-2">
            {canSendToClient ? (
              publicOnlyMvp ? (
                // MVP: private client sending is frozen (public-only) for accounts without the bypass.
                <span className="opacity-35 pointer-events-none select-none">
                  <Button size="sm" disabled className="bg-[#6b2d43] hover:bg-[#5a2538]">
                    <Send className="h-4 w-4" />
                    שלח ללקוח
                  </Button>
                </span>
              ) : (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    run(() => sendGallery(galleryId), 'הגלריה נשלחה ללקוח')
                  }
                  className="bg-[#6b2d43] hover:bg-[#5a2538]"
                >
                  <Send className="h-4 w-4" />
                  שלח ללקוח
                </Button>
              )
            ) : null}


            {status === 'editing' ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(() => markDeliveryReady(galleryId), 'הגלריה מוכנה למסירה')
                }
                className="bg-[#6b2d43] hover:bg-[#5a2538]"
              >
                <Truck className="h-4 w-4" />
                שלח מייל ללקוח עם תמונות מעובדות
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
                className="border-[#c9c5cd] hover:bg-[#f7f2f4]"
              >
                <Mail className="h-4 w-4" />
                {resendLabel}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Section: View Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#48464c]">תצוגה</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="border-[#c9c5cd] hover:bg-[#f7f2f4]">
              <Link href={clientLink} target="_blank">
                <ExternalLink className="h-4 w-4" />
                {clientLink.startsWith('/portfolio') ? 'תצוגה ציבורית' : 'תצוגת לקוח'}
              </Link>
            </Button>
          </div>
        </div>

        {/* Section: Status Management */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#48464c]">ניהול סטטוס</h3>
          <Select
            dir="rtl"
            value={status}
            disabled={isPending}
            onValueChange={(value) => {
              const nextStatus = value as GalleryStatus
              if (nextStatus === status) return
              run(
                () => updateGalleryStatus(galleryId, nextStatus),
                `הסטטוס עודכן ל־${GALLERY_STATUS_LABELS[nextStatus]}`
              )
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent className="border border-[#c9c5cd] bg-white text-[#100d1f] shadow-lg">
              {statusOptions.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="focus:bg-[#f7f2f4] focus:text-[#100d1f]"
                >
                  {GALLERY_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section: Dangerous Actions */}
        <div className="space-y-3 pt-4 border-t border-[#c9c5cd]">
          <h3 className="text-sm font-semibold text-[#48464c]">פעולות מסוכנות</h3>
          <DeleteGalleryButton
            galleryId={galleryId}
            galleryTitle={galleryTitle}
          />
        </div>
      </CardContent>
    </Card>
  )
}
