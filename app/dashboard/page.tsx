'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MVP_DEFAULT_DASHBOARD_PATH, PUBLIC_ONLY_MVP } from '@/lib/types/app.types'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { Button } from '@/components/ui/button'
import { resolveGalleryTableThumbnails } from '@/lib/actions/gallery.actions'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('משתמש')
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (PUBLIC_ONLY_MVP) {
      router.replace(MVP_DEFAULT_DASHBOARD_PATH)
      return
    }
  }, [router])

  useEffect(() => {
    if (PUBLIC_ONLY_MVP) return
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch user name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        setUserName((userData as any)?.name || 'משתמש')

        // Fetch recent galleries with client details and photo count
        const { data: galleries } = await supabase
          .from('galleries')
          .select(`
            *,
            client:clients(name),
            photos(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Fetch more to allow filtering

        const transformedGalleries = (galleries || []).map((gallery: any) => ({
          ...gallery,
          client: gallery.client,
          photo_count: gallery.photos?.[0]?.count || 0,
        }))

        let galleriesWithThumbnails = transformedGalleries
        try {
          const thumbnails = await resolveGalleryTableThumbnails(
            transformedGalleries.map((g) => ({
              id: g.id,
              cover_image: g.cover_image ?? null,
            }))
          )
          galleriesWithThumbnails = transformedGalleries.map((gallery) => ({
            ...gallery,
            thumbnail_url: thumbnails[gallery.id] ?? null,
          }))
        } catch (error) {
          console.warn('Failed to resolve gallery thumbnails:', error)
        }

        setRecentGalleries(galleriesWithThumbnails)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Calculate stats
  const drafts = recentGalleries.filter(g => g.status === 'draft').length
  const selection = recentGalleries.filter(g => g.status === 'selection').length
  const editing = recentGalleries.filter(g => g.status === 'editing').length
  const expired = recentGalleries.filter(g => {
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
      {/* Header Section */}
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
          <Link href="/dashboard/galleries/new">
            <Plus className="h-5 w-5 ml-2" />
            גלריה חדשה
          </Link>
        </Button>
      </header>

      {/* Stats Grid */}
      <StatsCards
        drafts={drafts}
        selection={selection}
        editing={editing}
        expired={expired}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Recent Galleries Table */}
      <RecentGalleriesTable galleries={recentGalleries} filter={activeFilter} />
    </div>
  )
}
