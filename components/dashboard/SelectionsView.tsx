'use client'

import { useTransition, useState } from 'react'
import Image from 'next/image'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [albumExpanded, setAlbumExpanded] = useState(false)
  const [editExpanded, setEditExpanded] = useState(false)

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
          title="אלבום"
          count={albumPhotos.length}
          photos={albumPhotos}
          expanded={albumExpanded}
          onToggle={() => setAlbumExpanded(!albumExpanded)}
        />
        <SelectionColumn
          title="לעיבוד"
          count={editPhotos.length}
          photos={editPhotos}
          expanded={editExpanded}
          onToggle={() => setEditExpanded(!editExpanded)}
        />
      </div>
    </div>
  )
}

type SelectionColumnProps = {
  title: string
  count: number
  photos: SelectionPhoto[]
  expanded: boolean
  onToggle: () => void
}

function SelectionColumn({
  title,
  count,
  photos,
  expanded,
  onToggle,
}: SelectionColumnProps) {
  const hasMorePhotos = photos.length > 6

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
          <div className="relative">
            <div
              className={`transition-all duration-500 ease-in-out ${
                expanded ? 'max-h-none' : 'max-h-[300px] overflow-hidden'
              }`}
            >
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
            </div>
            {hasMorePhotos && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center pt-8 pb-4 bg-gradient-to-t from-white via-white to-transparent">
                <Button
                  variant="outline"
                  onClick={onToggle}
                  className="bg-white hover:bg-[#f7f2f4] border-[#c9c5cd] shadow-sm"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 ml-2" />
                      הסתר תמונות / כווץ תצוגה
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 ml-2" />
                      הצג את כל התמונות ({photos.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
