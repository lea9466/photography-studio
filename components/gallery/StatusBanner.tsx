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

  let message = MESSAGES[status]
  if (status === 'selection') {
    const parts: string[] = []
    if (maxAlbum != null) parts.push(`עד ${maxAlbum} לאלבום`)
    if (maxEdit != null) parts.push(`עד ${maxEdit} לעיבוד`)
    if (parts.length) message += ` (${parts.join(' · ')})`
  }

  return (
    <div className="rounded-xl border border-[--border] bg-[--background] px-4 py-3 text-center animate-fade-in">
      <Badge variant="default" className="mb-2">
        {status === 'delivery_ready' ? 'מוכן' : 'עדכון'}
      </Badge>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
