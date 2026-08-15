'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { getClientGalleryDownloadFiles } from '@/lib/actions/download.actions'
import { downloadFilesAsZip } from '@/lib/client-zip-download'
import { Button } from '@/components/ui/button'

type ClientDownloadButtonProps = {
  galleryId: string
  type: 'watermarked' | 'original'
}

export function ClientDownloadButton({
  galleryId,
  type,
}: ClientDownloadButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    const toastId = toast.loading('מכינה רשימת קבצים...')

    startTransition(async () => {
      try {
        const files = await getClientGalleryDownloadFiles(galleryId, type)
        const { failed } = await downloadFilesAsZip(
          files,
          `${type}-${galleryId.slice(0, 8)}.zip`,
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

  const label = type === 'watermarked' ? 'הורד עם סימן מים (ZIP)' : 'הורד מקור (ZIP)'

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleDownload}
      className="rounded-full border-[--border] bg-[--background] shadow-sm transition-all hover:border-accent hover:text-accent hover:shadow-md"
    >
      <Download className="h-4 w-4" />
      {isPending ? 'מכין ZIP...' : label}
    </Button>
  )
}
