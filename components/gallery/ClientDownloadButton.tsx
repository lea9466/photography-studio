'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { createClientDownload } from '@/lib/actions/download.actions'
import { Button } from '@/components/ui/button'

type ClientDownloadButtonProps = {
  galleryId: string
  type: 'watermarked' | 'original'
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

export function ClientDownloadButton({
  galleryId,
  type,
}: ClientDownloadButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    const downloadWindow = window.open('', '_blank')
    toast.info('מכין קובץ ZIP...')

    startTransition(async () => {
      try {
        const { downloadUrl } = await createClientDownload(galleryId, type)

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

  const label = type === 'watermarked' ? 'הורד עם סימן מים (ZIP)' : 'הורד מקור (ZIP)'

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleDownload}
    >
      <Download className="h-4 w-4" />
      {isPending ? 'מכין ZIP...' : label}
    </Button>
  )
}
