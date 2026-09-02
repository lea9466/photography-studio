import { Album, Pencil } from 'lucide-react'
import type { GalleryStatus } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'

const MESSAGES: Record<GalleryStatus, string> = {
  selection: 'ברוכים הבאים! התחילו לבחור תמונות',
  editing: 'הבחירה הסתיימה – התמונות בעיבוד',
  delivery_ready: 'התמונות המעובדות מוכנות להורדה!',
  locked: 'הגלריה סגורה',
  draft: '',
  public: '',
}

type StatusBannerProps = {
  status: GalleryStatus
  maxAlbum?: number | null
  maxEdit?: number | null
}

export function StatusBanner({ status, maxAlbum, maxEdit }: StatusBannerProps) {
  if (status === 'draft' || status === 'public') return null

  return (
    <div className="rounded-xl border border-[--border] bg-[--background] px-4 py-3 text-center animate-fade-in">
      <Badge variant="default" className="mb-2">
        {status === 'delivery_ready' ? 'מוכן' : 'עדכון'}
      </Badge>
      <p className="text-sm font-medium">{MESSAGES[status]}</p>

      {status === 'selection' ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[--muted]">
          <span className="inline-flex items-center gap-1.5">
            <Album className="h-4 w-4 shrink-0 text-rose-500" />
            סימון לאלבום{maxAlbum != null ? ` · עד ${maxAlbum} תמונות` : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Pencil className="h-4 w-4 shrink-0 text-amber-500" />
            סימון לעיבוד{maxEdit != null ? ` · עד ${maxEdit} תמונות` : ''}
          </span>
        </div>
      ) : null}
    </div>
  )
}
