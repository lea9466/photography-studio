'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Images, Plus } from 'lucide-react'
import { fetchDashboardGalleries } from '@/lib/actions/dashboard.actions'
import { fetchGalleryLayoutMode, getPublicGalleryQuota } from '@/lib/actions/gallery.actions'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { GalleryLayoutModeSetting } from '@/components/dashboard/GalleryLayoutModeSetting'
import { Button } from '@/components/ui/button'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
import type { GalleryLayoutMode } from '@/lib/types/database.types'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_GALLERY_PHOTOS,
} from '@/lib/types/app.types'
import { cn } from '@/lib/utils'

const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

export default function GalleriesPage() {
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [layoutMode, setLayoutMode] = useState<GalleryLayoutMode>('separated')
  const [maxGalleries, setMaxGalleries] = useState(MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [galleries, mode, quota] = await Promise.all([
          fetchDashboardGalleries(),
          fetchGalleryLayoutMode(),
          getPublicGalleryQuota(),
        ])
        setRecentGalleries(galleries)
        setLayoutMode(mode)
        setMaxGalleries(quota?.maxGalleries ?? MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER)
      } catch (error) {
        console.error('Failed to load galleries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
          <div className="flex items-center justify-center rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] py-16">
            <div className="text-[--muted]">טוען...</div>
          </div>
        </div>
      </div>
    )
  }

  const galleryCount = recentGalleries.length
  const canCreateGallery = galleryCount < maxGalleries

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
                <Images className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                  כל הגלריות
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                  {galleryCount}/{maxGalleries} גלריות · עד {MAX_PUBLIC_GALLERY_PHOTOS} תמונות בכל גלריה
                </p>
              </div>
            </div>
            {canCreateGallery ? (
              <Button asChild className={cn(ACCENT_BUTTON_CLASS, 'px-6 py-3 text-base font-semibold')}>
                <Link href="/dashboard/galleries/new">
                  <Plus className="h-5 w-5 ml-2" />
                  גלריה חדשה
                </Link>
              </Button>
            ) : (
              <Button
                disabled
                className={cn(ACCENT_BUTTON_CLASS, 'cursor-not-allowed px-6 py-3 text-base font-semibold opacity-50')}
                title={`מקסימום ${maxGalleries} גלריות`}
              >
                <Plus className="h-5 w-5 ml-2" />
                גלריה חדשה
              </Button>
            )}
          </div>
        </div>

        <GalleryLayoutModeSetting key={layoutMode} initialMode={layoutMode} />

        <RecentGalleriesTable
          galleries={recentGalleries}
          title="כל הגלריות"
          variant="section"
        />
      </div>
    </div>
  )
}
