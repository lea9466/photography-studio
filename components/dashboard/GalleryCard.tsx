'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Archive, ExternalLink, MoreHorizontal, Send } from 'lucide-react'
import {
  archiveGallery,
  sendGallery,
} from '@/lib/actions/gallery.actions'
import { DeleteGalleryButton } from '@/components/dashboard/DeleteGalleryButton'
import {
  GALLERY_STATUS_LABELS,
  GALLERY_TYPE_LABELS,
  type GalleryListItem,
} from '@/lib/types/app.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

type GalleryCardProps = {
  gallery: GalleryListItem
}

export function GalleryCard({ gallery }: GalleryCardProps) {
  const [isPending, startTransition] = useTransition()
  const canSend = gallery.status === 'draft'
  const canArchive = gallery.status !== 'locked'

  function runAction(
    action: () => Promise<void>,
    successMessage: string
  ) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'משהו השתבש, נסו שוב'
        )
      }
    })
  }

  return (
    <Card className="animate-float-up transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-lg">
            <Link
              href={`/dashboard/galleries/${gallery.id}`}
              className="transition-colors hover:text-[--muted]"
            >
              {gallery.title}
            </Link>
          </CardTitle>
          <CardDescription className="mt-1 truncate">
            {gallery.client_name ?? 'ללא לקוח'}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={isPending}
              aria-label="פעולות גלריה"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/galleries/${gallery.id}`}>
                <ExternalLink className="h-4 w-4" />
                פתח
              </Link>
            </DropdownMenuItem>
            {canSend ? (
              <DropdownMenuItem
                disabled={isPending}
                onSelect={() =>
                  runAction(
                    () => sendGallery(gallery.id),
                    'הגלריה סומנה כנשלחה'
                  )
                }
              >
                <Send className="h-4 w-4" />
                שלח
              </DropdownMenuItem>
            ) : null}
            {canArchive ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={() =>
                    runAction(
                      () => archiveGallery(gallery.id),
                      'הגלריה הועברה לארכיב'
                    )
                  }
                >
                  <Archive className="h-4 w-4" />
                  ארכיב
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DeleteGalleryButton
              galleryId={gallery.id}
              galleryTitle={gallery.title}
              variant="menu-item"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{GALLERY_STATUS_LABELS[gallery.status]}</Badge>
          <Badge variant="outline">
            {GALLERY_TYPE_LABELS[gallery.gallery_type]}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-[--muted]">
          <span>{gallery.photo_count} תמונות</span>
          <span>{formatDate(gallery.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/dashboard/galleries/${gallery.id}`}>פתיחה</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/galleries/${gallery.id}/photos`}>תמונות</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
