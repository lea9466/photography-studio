'use client'

import { Images } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PhotoEditEmptyStateProps = {
  onCreate: () => void
}

export function PhotoEditEmptyState({ onCreate }: PhotoEditEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[--border] px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[--muted]/20 text-[--muted]">
        <Images className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold text-[--foreground]">
        עדיין לא הוספת תמונות לפני ואחרי
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[--muted]">
        העלי תמונה מקורית ותמונה מעובדת והציגי ללקוחות את תהליך העריכה שלך.
      </p>
      <Button type="button" className="mt-6" onClick={onCreate}>
        יצירת הזוג הראשון
      </Button>
    </div>
  )
}
