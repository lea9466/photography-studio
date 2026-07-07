'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { 
  Edit,
  Share2,
  MoreVertical,
  ChevronLeft,
  Archive,
  Trash2,
  Copy,
  Check,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { deleteGallery, updateGallerySettings } from '@/lib/actions/gallery.actions'
import { getDisplayGalleryStatus } from '@/lib/types/app.types'
import type { Gallery, Client, GalleryStatus } from '@/lib/types/database.types'

export type GalleryWithDetails = Gallery & {
  client?: Client | null
  photo_count?: number
  cover_image?: string | null
  thumbnail_url?: string | null
  is_public?: boolean
}

type GalleryRowProps = {
  gallery: GalleryWithDetails
  selected: boolean
  onSelect: (id: string) => void
}

function getStatusBadge(status: string) {
  const displayStatus = getDisplayGalleryStatus(status as GalleryStatus)
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'טיוטה', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    public: { label: 'ציבורי', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    selection: { label: 'ממתין לבחירה', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
    editing: { label: 'בעריכה', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    delivery_ready: { label: 'מוכן למסירה', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    locked: { label: 'נעול', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  }

  const config = statusConfig[displayStatus] || { label: displayStatus, className: 'bg-gray-100 text-gray-800' }
  
  return (
    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap', config.className)}>
      {config.label}
    </span>
  )
}

function GalleryRow({ gallery, selected, onSelect }: GalleryRowProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(gallery.is_public || false)
  const [isPending, startTransition] = useTransition()

  const handleShare = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const galleryLink = gallery.gallery_type === 'portfolio' && gallery.slug
      ? `${baseUrl}/portfolio/${gallery.slug}`
      : `${baseUrl}/g/${gallery.id}`

    await navigator.clipboard.writeText(galleryLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTogglePublic = (checked: boolean) => {
    startTransition(async () => {
      try {
        await updateGallerySettings(gallery.id, { isPublic: checked })
        setIsPublic(checked)
        toast.success(
          checked
            ? 'הגלריה תוצג בדף הבית — כרטיס עם תמונת שער + 4 תמונות בסקשן "תמונות אחרונות"'
            : 'הגלריה לא תוצג בדף הבית'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון')
      }
    })
  }

  const handleArchive = () => {
    setArchiveDialogOpen(true)
  }

  const confirmArchive = () => {
    startTransition(async () => {
      try {
        await deleteGallery(gallery.id)
        toast.success('הגלריה הועברה לארכיון בהצלחה')
        setArchiveDialogOpen(false)
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'העברה לארכיון נכשלה')
      }
    })
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteGallery(gallery.id)
        toast.success('הגלריה נמחקה בהצלחה')
        setDeleteDialogOpen(false)
        // Refresh the page to update the list
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'מחיקת הגלריה נכשלה')
      }
    })
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <>
      <tr className="hover:bg-[--background] transition-colors">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(gallery.id)}
            className="h-4 w-4"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[--background] border border-[--border]">
              {gallery.thumbnail_url && !imageError ? (
                <img 
                  alt={gallery.title} 
                  className={cn(
                    'w-full h-full',
                    gallery.cover_image ? 'object-cover' : 'object-contain p-1.5 bg-white'
                  )}
                  src={gallery.thumbnail_url}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[--muted]">
                  <span className="text-2xl">📷</span>
                </div>
              )}
            </div>
            <span className="font-semibold text-[--foreground]">{gallery.title}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-[--muted]">{gallery.client?.name || 'ללא לקוח'}</td>
        <td className="px-6 py-4">
          {getStatusBadge(gallery.status)}
        </td>
        <td className="px-6 py-4 text-center text-sm">{gallery.photo_count || 0}</td>
        <td className="px-6 py-4">
          <div
            className="flex items-center justify-center gap-2"
            title="הצג בדף הבית — עד 4 גלריות ציבוריות; 4 תמונות מכל גלריה בסקשן תמונות אחרונות"
          >
            <Globe className="h-4 w-4 text-[--muted]" />
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isPending}
              className="scale-75"
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/dashboard/galleries/${gallery.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 ml-2" />
                  העבר לארכיון
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק גלריה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </td>
      </tr>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>מחיקת גלריה</DialogTitle>
            <DialogDescription>
              האם את/ה בטוח/ה שברצונך למחוק את הגלריה "{gallery.title}"? פעולה זו תמחק גם את כל התמונות בגלריה ולא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? 'מוחק...' : 'מחק גלריה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>העברה לארכיון</DialogTitle>
            <DialogDescription>
              האם את/ה בטוח/ה שברצונך להעביר את הגלריה "{gallery.title}" לארכיון?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setArchiveDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={confirmArchive}
              disabled={isPending}
            >
              {isPending ? 'מעביר...' : 'העבר לארכיון'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type RecentGalleriesTableProps = {
  galleries: GalleryWithDetails[]
  filter?: string
  title?: string
}

export function RecentGalleriesTable({ galleries, filter, title = 'גלריות אחרונות' }: RecentGalleriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const filteredGalleries = filter && filter !== 'all'
    ? galleries.filter(gallery => {
        if (filter === 'draft') return gallery.status === 'draft'
        if (filter === 'public') return gallery.status === 'public'
        if (filter === 'selection') return gallery.status === 'selection'
        if (filter === 'editing') return gallery.status === 'editing'
        if (filter === 'expired') {
          // Include locked galleries and expired galleries
          if (gallery.status === 'locked') return true
          if (gallery.expires_at) {
            return new Date(gallery.expires_at) < new Date()
          }
          return false
        }
        return true
      })
    : galleries

  function toggleSelectAll() {
    if (selectedIds.size === filteredGalleries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredGalleries.map((g) => g.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`למחוק ${selectedIds.size} גלריות?`)) {
      return
    }

    startTransition(async () => {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => deleteGallery(id)))
        toast.success('הגלריות נמחקו')
        setSelectedIds(new Set())
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }
  return (
    <>
      <div className="mb-4 rounded-xl border border-[#e8d5c4] bg-[#fdf8f4] px-5 py-4 text-sm text-[#5c4a3d] dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <span className="font-semibold">גלריות ציבוריות בדף הבית:</span>{' '}
        עד 4 גלריות המסומנות כציבוריות. בכרטיס הגלריה — תמונת השער (אם הוגדרה); בסקשן &quot;תמונות אחרונות&quot; — 4 תמונות אקראיות מכל גלריה (16 תמונות בסך הכל).
      </div>
      <section className="bg-white dark:bg-zinc-900 border border-[--border] rounded-xl overflow-hidden mb-6">
      <div className="p-6 border-b border-[--border] flex items-center justify-between">
        <h3 className="font-semibold text-lg text-[--foreground]">{title}</h3>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            מחק נבחרים ({selectedIds.size})
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[--background] text-[--muted]">
              <th className="px-6 py-3 text-sm font-medium w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredGalleries.length && filteredGalleries.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-6 py-3 text-sm font-medium">שם גלריה</th>
              <th className="px-6 py-3 text-sm font-medium">לקוח</th>
              <th className="px-6 py-3 text-sm font-medium">סטטוס</th>
              <th className="px-6 py-3 text-sm font-medium text-center">תמונות</th>
              <th className="px-6 py-3 text-sm font-medium text-center">מוצג באתר</th>
              <th className="px-6 py-3 text-sm font-medium text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {filteredGalleries.length > 0 ? (
              filteredGalleries.map((gallery) => (
                <GalleryRow key={gallery.id} gallery={gallery} selected={selectedIds.has(gallery.id)} onSelect={toggleSelect} />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[--muted]">
                  אין גלריות עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
    </>
  )
}
