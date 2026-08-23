'use client'

import { useTransition, useState, useMemo } from 'react'
import Image from 'next/image'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { getSelectedPhotosOriginalFiles } from '@/lib/actions/download.actions'
import { downloadFilesAsZip } from '@/lib/client-zip-download'
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
  clientName: string
  albumPhotos: SelectionPhoto[]
  editPhotos: SelectionPhoto[]
}

/** Strips characters invalid in Windows/Mac filenames from a display name. */
function sanitizeForFilename(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]/g, '').trim() || 'לקוח'
}

export function SelectionsView({
  galleryId,
  clientName,
  albumPhotos,
  editPhotos,
}: SelectionsViewProps) {
  const [isPending, startTransition] = useTransition()
  const [albumExpanded, setAlbumExpanded] = useState(false)
  const [editExpanded, setEditExpanded] = useState(false)

  const albumPhotoIds = useMemo(() => albumPhotos.map((photo) => photo.id), [albumPhotos])
  const editPhotoIds = useMemo(() => editPhotos.map((photo) => photo.id), [editPhotos])
  const selectedPhotoIds = useMemo(
    () => [...new Set([...albumPhotoIds, ...editPhotoIds])],
    [albumPhotoIds, editPhotoIds]
  )
  // Matches what actually lands in the zip: a photo picked for both shows up
  // in both folders, so the download count counts it twice too.
  const downloadFileCount = albumPhotoIds.length + editPhotoIds.length

  function handleDownload() {
    const toastId = toast.loading('מכינה רשימת קבצים...')
    const safeClientName = sanitizeForFilename(clientName)

    startTransition(async () => {
      try {
        const files = await getSelectedPhotosOriginalFiles(galleryId, albumPhotoIds, editPhotoIds)
        // Server sorts each file into "אלבום"/"עיבוד" — wrap both under a
        // client-name folder here so the zip reads as "<client>/אלבום/..."
        // and "<client>/עיבוד/...". An empty category never produces files
        // for that folder, so it just doesn't appear — nothing extra needed.
        const namedFiles = files.map((file) => ({
          ...file,
          filename: `${safeClientName}/${file.filename}`,
        }))
        const { failed } = await downloadFilesAsZip(
          namedFiles,
          `${safeClientName}.zip`,
          (completed, total) => {
            toast.loading(`מורידה תמונות... ${completed}/${total}`, { id: toastId })
          }
        )
        if (failed.length > 0) {
          toast.warning(`ה-ZIP מוכן, אך ${failed.length} תמונות נכשלו בהורדה`, { id: toastId })
        } else {
          toast.success('ה-ZIP מוכן להורדה', { id: toastId })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה', { id: toastId })
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || selectedPhotoIds.length === 0}
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          הורד תמונות נבחרות ({downloadFileCount}, ZIP)
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
