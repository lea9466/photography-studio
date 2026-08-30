'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { fetchDashboardGalleries, fetchStudioPublicPath } from '@/lib/actions/dashboard.actions'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { FloatingNewGalleryButton } from '@/components/dashboard/FloatingNewGalleryButton'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'
import { galleryKind } from '@/lib/gallery-kind'

export default function PrivateGalleriesPage() {
  const [galleries, setGalleries] = useState<GalleryWithDetails[]>([])
  const [studioPath, setStudioPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [all, path] = await Promise.all([
          fetchDashboardGalleries(),
          fetchStudioPublicPath(),
        ])
        if (cancelled) return
        setGalleries(all)
        setStudioPath(path)
      } catch (error) {
        console.error('Failed to load private galleries:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
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

  const clientGalleries = galleries.filter((gallery) => galleryKind(gallery) === 'client')

  return (
    <div className="animate-fade-in">
      <FloatingNewGalleryButton href="/dashboard/galleries/new?kind=client" />

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                גלריות פרטיות
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                גלריות שנשלחות ללקוח — מוגנות סיסמה, בחירת תמונות ומסירה. מוגשות
                מדומיין נפרד ומאובטח.
              </p>
            </div>
          </div>
        </div>

        <RecentGalleriesTable
          galleries={clientGalleries}
          title="גלריות פרטיות"
          variant="section"
          sectionIndex={1}
          sectionDescription="ניהול, עריכה ושיתוף של גלריות הלקוח שלך"
          emptyLabel="עדיין אין גלריות פרטיות — צרי גלריה חדשה כדי להתחיל"
          studioPath={studioPath}
        />
      </div>
    </div>
  )
}
