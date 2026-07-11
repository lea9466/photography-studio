'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { fetchDashboardGalleries } from '@/lib/actions/dashboard.actions'
import { fetchGalleryLayoutMode } from '@/lib/actions/gallery.actions'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { GalleryLayoutModeSetting } from '@/components/dashboard/GalleryLayoutModeSetting'
import { Button } from '@/components/ui/button'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
import type { GalleryLayoutMode } from '@/lib/types/database.types'
import {
  MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER,
  MAX_PUBLIC_GALLERY_PHOTOS,
} from '@/lib/types/app.types'

export default function GalleriesPage() {
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [layoutMode, setLayoutMode] = useState<GalleryLayoutMode>('separated')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [galleries, mode] = await Promise.all([
          fetchDashboardGalleries(),
          fetchGalleryLayoutMode(),
        ])
        setRecentGalleries(galleries)
        setLayoutMode(mode)
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
      <div className="animate-fade-in space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-[--muted]">טוען...</div>
        </div>
      </div>
    )
  }

  const galleryCount = recentGalleries.length
  const canCreateGallery = galleryCount < MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">
            כל הגלריות
          </h1>
          <p className="text-sm text-[--muted]">
            {galleryCount}/{MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER} גלריות · עד {MAX_PUBLIC_GALLERY_PHOTOS} תמונות בכל גלריה
          </p>
        </div>
        {canCreateGallery ? (
          <Button
            asChild
            className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] shadow-lg shadow-[#7D3A52]/20 px-6 py-3 text-base font-semibold"
          >
            <Link href="/dashboard/galleries/new">
              <Plus className="h-5 w-5 ml-2" />
              גלריה חדשה
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            className="bg-[#7D3A52] text-white opacity-50 px-6 py-3 text-base font-semibold cursor-not-allowed"
            title={`מקסימום ${MAX_PUBLIC_GALLERIES_PER_PHOTOGRAPHER} גלריות`}
          >
            <Plus className="h-5 w-5 ml-2" />
            גלריה חדשה
          </Button>
        )}
      </header>

      <GalleryLayoutModeSetting key={layoutMode} initialMode={layoutMode} />

      {/* Galleries Table */}
      <RecentGalleriesTable galleries={recentGalleries} title="כל הגלריות" />
    </div>
  )
}
