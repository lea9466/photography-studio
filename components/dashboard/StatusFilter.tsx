import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GALLERY_STATUS_LABELS } from '@/lib/types/app.types'
import type { GalleryStatusFilter } from '@/lib/types/app.types'
import type { GalleryStatus } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

const FILTER_OPTIONS: { value: GalleryStatusFilter; label: string }[] = [
  { value: 'all', label: 'הכל' },
  ...(Object.entries(GALLERY_STATUS_LABELS) as [GalleryStatus, string][]).map(
    ([value, label]) => ({ value, label })
  ),
]

type StatusFilterProps = {
  current: GalleryStatusFilter
}

export function StatusFilter({ current }: StatusFilterProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[--muted]">סינון לפי סטטוס</p>
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={current === option.value ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link
              href={
                option.value === 'all'
                  ? '/dashboard/galleries'
                  : `/dashboard/galleries?status=${option.value}`
              }
              className={cn(current === option.value && 'pointer-events-none')}
            >
              {option.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
