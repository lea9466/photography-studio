'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Edit,
  Share2,
  MoreVertical,
  ChevronLeft,
  Archive,
  Trash2,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Gallery, Client } from '@/lib/types/database.types'

export type GalleryWithDetails = Gallery & {
  client?: Client | null
  photo_count?: number
  cover_image?: string | null
  first_photo_url?: string | null
}

type GalleryRowProps = {
  gallery: GalleryWithDetails
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'טיוטה', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    sent: { label: 'נשלח ללקוח', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    selection: { label: 'ממתין לבחירה', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
    editing: { label: 'בעריכה', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    delivery_ready: { label: 'מוכן למסירה', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    locked: { label: 'נעול', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  
  return (
    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap', config.className)}>
      {config.label}
    </span>
  )
}

function GalleryRow({ gallery }: GalleryRowProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleShare = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const galleryLink = gallery.gallery_type === 'portfolio' && gallery.slug
      ? `${baseUrl}/portfolio/${gallery.slug}`
      : `${baseUrl}/g/${gallery.id}`
    
    await navigator.clipboard.writeText(galleryLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log('Archive gallery:', gallery.id)
  }

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete gallery:', gallery.id)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <tr className="hover:bg-[--background] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[--background] border border-[--border]">
            {gallery.first_photo_url && !imageError ? (
              <img 
                alt={gallery.title} 
                className="w-full h-full object-cover" 
                src={gallery.first_photo_url}
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
      <td className="px-6 py-4 text-left">
        <div className="flex items-center justify-end gap-2">
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
      </td>
    </tr>
  )
}

type RecentGalleriesTableProps = {
  galleries: GalleryWithDetails[]
  filter?: string
  title?: string
}

export function RecentGalleriesTable({ galleries, filter, title = 'גלריות אחרונות' }: RecentGalleriesTableProps) {
  const filteredGalleries = filter && filter !== 'all'
    ? galleries.filter(gallery => {
        if (filter === 'draft') return gallery.status === 'draft'
        if (filter === 'waiting') return gallery.status === 'selection' || gallery.status === 'editing'
        if (filter === 'sent') return gallery.status === 'sent'
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
  return (
    <section className="bg-white dark:bg-zinc-900 border border-[--border] rounded-xl overflow-hidden mb-6">
      <div className="p-6 border-b border-[--border]">
        <h3 className="font-semibold text-lg text-[--foreground]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[--background] text-[--muted]">
              <th className="px-6 py-3 text-sm font-medium">שם גלריה</th>
              <th className="px-6 py-3 text-sm font-medium">לקוח</th>
              <th className="px-6 py-3 text-sm font-medium">סטטוס</th>
              <th className="px-6 py-3 text-sm font-medium text-center">תמונות</th>
              <th className="px-6 py-3 text-sm font-medium text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {filteredGalleries.length > 0 ? (
              filteredGalleries.map((gallery) => (
                <GalleryRow key={gallery.id} gallery={gallery} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[--muted]">
                  אין גלריות עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
