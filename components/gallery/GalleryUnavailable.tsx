import { CalendarX, Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type GalleryUnavailableProps = {
  reason: 'expired' | 'locked'
  galleryTitle: string
  studioName?: string | null
}

const REASON_CONFIG = {
  expired: {
    Icon: CalendarX,
    title: 'פג תוקף הגלריה',
    body: 'תקופת הצפייה בגלריה הסתיימה. אפשר לפנות לצלם/ת ולבקש לחדש את הגישה.',
  },
  locked: {
    Icon: Lock,
    title: 'הגלריה סגורה',
    body: 'הגלריה נסגרה על ידי הצלם/ת ואינה זמינה כרגע לצפייה.',
  },
} as const

export function GalleryUnavailable({
  reason,
  galleryTitle,
  studioName,
}: GalleryUnavailableProps) {
  const config = REASON_CONFIG[reason]
  const Icon = config.Icon

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[--muted]/40 text-[--muted]">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>
            {studioName ?? 'Studio Gallery'} · {galleryTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[--muted]">{config.body}</p>
        </CardContent>
      </Card>
    </div>
  )
}
