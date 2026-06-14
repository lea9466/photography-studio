'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { createDownloadJob } from '@/lib/actions/download.actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export type SelectionPhoto = {
  id: string
  preview_url: string | null
  preview_signed_url: string | null
  selected_album: boolean
  selected_edit: boolean
}

type SelectionsViewProps = {
  galleryId: string
  albumPhotos: SelectionPhoto[]
  editPhotos: SelectionPhoto[]
}

function triggerBrowserDownload(url: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function SelectionsView({
  galleryId,
  albumPhotos,
  editPhotos,
}: SelectionsViewProps) {
  const [isPending, startTransition] = useTransition()

  function handleDownload(type: 'preview' | 'original') {
    const downloadWindow = window.open('', '_blank')
    toast.info('מכין קובץ ZIP...')

    startTransition(async () => {
      try {
        const { downloadUrl } = await createDownloadJob(galleryId, type)

        if (downloadWindow && !downloadWindow.closed) {
          downloadWindow.location.href = downloadUrl
        } else {
          triggerBrowserDownload(downloadUrl)
        }

        toast.success('ההורדה התחילה')
      } catch (error) {
        downloadWindow?.close()
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleDownload('preview')}
        >
          <Download className="h-4 w-4" />
          הורד previews (ZIP)
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleDownload('original')}
        >
          <Download className="h-4 w-4" />
          הורד מקור (ZIP)
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SelectionColumn
          title="❤️ אלבום"
          count={albumPhotos.length}
          photos={albumPhotos}
        />
        <SelectionColumn
          title="✨ לעיבוד"
          count={editPhotos.length}
          photos={editPhotos}
        />
      </div>
    </div>
  )
}

function SelectionColumn({
  title,
  count,
  photos,
}: {
  title: string
  count: number
  photos: SelectionPhoto[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="muted">{count}</Badge>
        </CardTitle>
        <CardDescription>תמונות שנבחרו על ידי הלקוח</CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-[--muted]">אין בחירות עדיין</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-[--border]"
              >
                {photo.preview_signed_url ? (
                  <Image
                    src={photo.preview_signed_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
