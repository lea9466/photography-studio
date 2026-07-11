'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  getAnnouncementIconComponent,
  getAnnouncementIconStyles,
  normalizeAnnouncementIcon,
  type AnnouncementIconKey,
} from '@/lib/announcements/icons'
import {
  dismissAnnouncement,
  isAnnouncementDismissed,
  type Announcement,
} from '@/lib/announcements/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnnouncementBannerProps = {
  announcement: Announcement | null
  accentColor?: string | null
}

export function AnnouncementBanner({
  announcement,
  accentColor,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!announcement?.id || !announcement.is_active) {
      setVisible(false)
      return
    }

    setVisible(!isAnnouncementDismissed(announcement.id))
  }, [announcement])

  if (!announcement || !announcement.is_active || !visible) {
    return null
  }

  const iconKey = normalizeAnnouncementIcon(announcement.icon) as AnnouncementIconKey
  const Icon = getAnnouncementIconComponent(iconKey)
  const styles = getAnnouncementIconStyles(iconKey)

  function handleDismiss() {
    dismissAnnouncement(announcement!.id)
    setVisible(false)
  }

  return (
    <div
      className={cn(
        'relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-l p-4 shadow-sm sm:p-5',
        styles.border,
        styles.surface
      )}
      style={
        accentColor
          ? {
              borderColor: `${accentColor}33`,
              backgroundImage: `linear-gradient(to left, ${accentColor}12, white, white)`,
            }
          : undefined
      }
      role="status"
      aria-live="polite"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute left-3 top-3 h-8 w-8 rounded-full text-slate-500 hover:bg-white/80 hover:text-slate-800"
        aria-label="סגירת ההודעה"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-4 pl-10 sm:gap-5">
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5',
            styles.iconBg,
            styles.iconText
          )}
          style={
            accentColor
              ? {
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                }
              : undefined
          }
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {announcement.title}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            {announcement.content}
          </p>
        </div>
      </div>
    </div>
  )
}
