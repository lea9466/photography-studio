'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ChevronDown, ExternalLink, Mail, Send, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  resendGalleryEmail,
  sendGallery,
  updateGalleryStatus,
} from '@/lib/actions/gallery.actions'
import { markDeliveryReady } from '@/lib/actions/client-gallery.actions'
import { DeleteGalleryButton } from '@/components/dashboard/DeleteGalleryButton'
import { SendGalleryConfirmDialog } from '@/components/dashboard/SendGalleryConfirmDialog'
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
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
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
    <div className="space-y-6">
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="space-y-6">
        {/* Section: Client Communication */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#7D3A52]"><span className="h-1.5 w-1.5 rounded-full bg-[#7D3A52]" aria-hidden />תקשורת עם לקוח</h3>
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
                  onClick={() => setSendConfirmOpen(true)}
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
                className="border-[#7D3A52]/30 bg-[#7D3A52]/[0.05] text-[#7D3A52] hover:bg-[#7D3A52]/10"
              >
                <Mail className="h-4 w-4" />
                {resendLabel}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Section: View Actions */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#7D3A52]"><span className="h-1.5 w-1.5 rounded-full bg-[#7D3A52]" aria-hidden />תצוגה</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="bg-[#7D3A52] text-white shadow-sm hover:bg-[#6a2f44]">
              <Link href={clientLink} target="_blank">
                <ExternalLink className="h-4 w-4" />
                {clientLink.startsWith('/portfolio') ? 'תצוגה ציבורית' : 'תצוגת לקוח'}
              </Link>
            </Button>
          </div>
        </div>

        </div>

        {/* Rarely needed — kept folded, but parallel to the primary actions. */}
        <details className="group rounded-xl border border-[#7D3A52]/20 bg-[#7D3A52]/[0.03] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-[#7D3A52] [&::-webkit-details-marker]:hidden">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            עוד אפשרויות
          </summary>
          <div className="mt-4 space-y-6">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#7D3A52]"><span className="h-1.5 w-1.5 rounded-full bg-[#7D3A52]" aria-hidden />ניהול סטטוס</h3>
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


            <div className="space-y-3 border-t border-[#c9c5cd] pt-4">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#7D3A52]"><span className="h-1.5 w-1.5 rounded-full bg-[#7D3A52]" aria-hidden />פעולות מסוכנות</h3>
              <DeleteGalleryButton
                galleryId={galleryId}
                galleryTitle={galleryTitle}
              />
            </div>

          </div>
        </details>
      </div>

      <SendGalleryConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={setSendConfirmOpen}
        pending={isPending}
        onConfirm={() => {
          setSendConfirmOpen(false)
          run(() => sendGallery(galleryId), 'הגלריה נשלחה ללקוח')
        }}
      />
    </div>
  )
}
