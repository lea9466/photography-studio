'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { QuickAccessActions } from '@/components/dashboard/QuickAccessActions'
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid'
import { Button } from '@/components/ui/button'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'

export default function DashboardPage() {
  const [userName, setUserName] = useState('משתמש')
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
            photos(count),
            first_photo:photos!inner(preview_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Fetch more to allow filtering

        // Transform the data to match the expected format
        const transformedGalleries = (galleries || []).map((gallery: any) => ({
          ...gallery,
          client: gallery.client,
          photo_count: gallery.photos?.[0]?.count || 0,
          first_photo_url: gallery.first_photo?.[0]?.preview_url || null,
        }))
        setRecentGalleries(transformedGalleries)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Calculate stats
  const drafts = recentGalleries.filter(g => g.status === 'draft').length
  const waiting = recentGalleries.filter(g => g.status === 'selection' || g.status === 'editing').length
  const sent = recentGalleries.filter(g => g.status === 'sent').length
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

      {/* Quick Actions Grid (Mobile Only) */}
      <QuickActionsGrid />

      {/* Stats Grid */}
      <StatsCards 
        drafts={drafts}
        waiting={waiting}
        sent={sent}
        expired={expired}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Recent Galleries Table */}
      <RecentGalleriesTable galleries={recentGalleries} filter={activeFilter} />

      {/* Quick Access Actions */}
      <QuickAccessActions upcomingMeetings={2} />
    </div>
  )
}
