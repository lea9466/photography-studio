'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { getClientEditedDownloadFiles } from '@/lib/actions/download.actions'
import { downloadFilesAsZip } from '@/lib/client-zip-download'
import { Button } from '@/components/ui/button'

type ClientEditedDownloadButtonProps = {
  galleryId: string
  hasProcessed: boolean
  isDelivered: boolean
}

export function ClientEditedDownloadButton({
  galleryId,
  hasProcessed,
  isDelivered,
}: ClientEditedDownloadButtonProps) {
  const [isPending, startTransition] = useTransition()
  const canDownload = hasProcessed && isDelivered
  const title = !hasProcessed
    ? 'אין תמונות מעובדות להורדה'
    : !isDelivered
      ? 'ההורדה תיפתח כשהגלריה תסומן כמוכנה למסירה'
      : undefined

  function handleDownload() {
    const toastId = toast.loading('מכינה רשימת קבצים...')

    startTransition(async () => {
      try {
        const files = await getClientEditedDownloadFiles(galleryId)
        const { failed } = await downloadFilesAsZip(
          files,
          `edited-${galleryId.slice(0, 8)}.zip`,
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
    <Button
      variant={canDownload ? 'default' : 'outline'}
      size="sm"
      disabled={isPending || !canDownload}
      onClick={handleDownload}
      title={title}
      className={
        canDownload
          ? 'rounded-full bg-accent text-white shadow-sm transition-all hover:shadow-md'
          : 'rounded-full border-[--border] bg-[--background] shadow-sm'
      }
    >
      <Download className="h-4 w-4" />
      {isPending ? 'מכין ZIP...' : 'הורד מעובדות באיכות מלאה (ZIP)'}
    </Button>
  )
}
