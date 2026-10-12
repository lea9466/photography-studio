'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteGallery } from '@/lib/actions/gallery.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

type DeleteGalleryButtonProps = {
  galleryId: string
  galleryTitle: string
  variant?: 'button' | 'menu-item'
  redirectTo?: string
}

export function DeleteGalleryButton({
  galleryId,
  galleryTitle,
  variant = 'button',
  redirectTo = '/dashboard/galleries',
}: DeleteGalleryButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteGallery(galleryId)
        toast.success('הגלריה וכל התמונות נמחקו')
        setOpen(false)
        router.push(redirectTo)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <>
      {variant === 'menu-item' ? (
        <DropdownMenuItem
          disabled={isPending}
          className="text-(--foreground) focus:text-(--foreground)"
          onSelect={(event) => {
            event.preventDefault()
            setOpen(true)
          }}
        >
          <Trash2 className="h-4 w-4" />
          מחק גלריה
        </DropdownMenuItem>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setOpen(true)}
          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          מחק גלריה
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle>מחיקת גלריה</DialogTitle>
          <DialogDescription>
            למחוק את &quot;{galleryTitle}&quot; ואת כל התמונות שבה? פעולה זו אינה
            ניתנת לביטול.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? 'מוחק...' : 'מחק'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
