'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MVP_DEFAULT_DASHBOARD_PATH } from '@/lib/types/app.types'
import { galleryKind } from '@/lib/gallery-kind'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { fetchDashboardOverview } from '@/lib/actions/dashboard.actions'
import { getPrivateGalleryQuota } from '@/lib/actions/gallery.actions'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import {
  PrivateGalleryQuotaSummary,
  type PrivateGalleryQuota,
} from '@/components/dashboard/PrivateGalleryQuotaSummary'
import { Button } from '@/components/ui/button'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('משתמש')
  const [studioPath, setStudioPath] = useState<string | null>(null)
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [quota, setQuota] = useState<PrivateGalleryQuota | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const [overview, privateQuota] = await Promise.all([
          fetchDashboardOverview(),
          // A quota failure (e.g. tier rows missing) must not blank the home.
          getPrivateGalleryQuota().catch(() => null),
        ])
        // MVP: the dashboard home is blocked for everyone except the bypass
        // account (server-decided). Non-bypass users are already redirected by
        // the middleware — this is the backstop.
        if (!overview.canViewDashboardHome) {
          router.replace(MVP_DEFAULT_DASHBOARD_PATH)
          return
        }
        setUserName(overview.userName)
        setStudioPath(overview.studioPath)
        setRecentGalleries(overview.galleries)
        setQuota(privateQuota)
      } catch (error) {
        console.error('Failed to load dashboard overview:', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  // The dashboard home is the private client-gallery workflow view — showcase
  // galleries have their own page and don't belong in these stats/list.
  const clientGalleries = recentGalleries.filter(
    (g) => galleryKind(g) === 'client'
  )

  const drafts = clientGalleries.filter(g => g.status === 'draft').length
  const selection = clientGalleries.filter(g => g.status === 'selection').length
  const editing = clientGalleries.filter(g => g.status === 'editing').length
  const deliveryReady = clientGalleries.filter(g => g.status === 'delivery_ready').length
  const expired = clientGalleries.filter(g => {
    if (g.status === 'locked') return true
    if (g.expires_at) {
      return new Date(g.expires_at) < new Date()
    }
    return false
  }).length

  if (loading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-[--muted]">טוען...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">
            שלום {userName} 👋
          </h1>
          <p className="text-sm text-[--muted]">
            הנה מה שקורה בסטודיו שלך היום
          </p>
        </div>
        <Button
          asChild
          className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] shadow-lg shadow-[#7D3A52]/20 px-6 py-3 text-base font-semibold md:flex hidden"
        >
          <Link href="/dashboard/galleries/new?kind=client">
            <Plus className="h-5 w-5 ml-2" />
            גלריה חדשה
          </Link>
        </Button>
      </header>

      {quota ? <PrivateGalleryQuotaSummary quota={quota} /> : null}

      <StatsCards
        drafts={drafts}
        selection={selection}
        editing={editing}
        deliveryReady={deliveryReady}
        expired={expired}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <RecentGalleriesTable
        galleries={clientGalleries}
        filter={activeFilter}
        studioPath={studioPath}
        perGalleryPhotoLimit={quota?.maxPhotosPerGallery}
      />
    </div>
  )
}
