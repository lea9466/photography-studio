'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImageIcon } from 'lucide-react'
import { updateRecentPhotosSectionTitle } from '@/lib/actions/gallery.actions'
import { RECENT_PHOTOS_SECTION_DEFAULTS } from '@/lib/recent-photos-section-copy'
import { GalleriesDashboardNote } from '@/components/dashboard/GalleriesDashboardNote'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type RecentPhotosSectionTitleSettingProps = {
  initialTitle: string | null
  selectedTheme: string
}

function GalleriesSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

export function RecentPhotosSectionTitleSetting({
  initialTitle,
  selectedTheme,
}: RecentPhotosSectionTitleSettingProps) {
  const [sectionTitle, setSectionTitle] = useState(initialTitle ?? '')
  const [isPending, startTransition] = useTransition()
  const themeDefault =
    RECENT_PHOTOS_SECTION_DEFAULTS[selectedTheme] ?? RECENT_PHOTOS_SECTION_DEFAULTS.elegant

  function handleSave() {
    startTransition(async () => {
      try {
        const updated = await updateRecentPhotosSectionTitle({
          title: sectionTitle,
        })
        setSectionTitle(updated.recent_photos_title ?? '')
        toast.success('כותרת הסקשן נשמרה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <GalleriesSection>
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                3
              </span>
              <h2 className="text-lg font-semibold text-[--foreground]">כותרת סקשן תמונות אחרונות</h2>
            </div>
          </div>
        </div>
      </div>

      <GalleriesDashboardNote>
        <p>
          הכותרת תוצג מעל סקשן התמונות האחרונות בדף הבית. אם השדה יישאר ריק, יוצג ברירת המחדל
          של ערכת העיצוב.
        </p>
        <p>הכותרת באנגלית (למשל LATEST) נשארת קבועה לפי ערכת העיצוב.</p>
      </GalleriesDashboardNote>

      <div className="space-y-2">
        <Label htmlFor="recent-photos-section-title">כותרת בעברית</Label>
        <Input
          id="recent-photos-section-title"
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
          placeholder={themeDefault}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={handleSave} disabled={isPending}>
          {isPending ? 'שומר...' : 'שמור כותרת'}
        </Button>
      </div>
    </GalleriesSection>
  )
}
