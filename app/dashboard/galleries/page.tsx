'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RecentGalleriesTable } from '@/components/dashboard/RecentGalleriesTable'
import { Button } from '@/components/ui/button'
import { signPreviewUrls } from '@/lib/actions/photo.actions'
import type { GalleryWithDetails } from '@/components/dashboard/RecentGalleriesTable'

export default function GalleriesPage() {
  const [recentGalleries, setRecentGalleries] = useState<GalleryWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch all galleries with client details and photo count
        const { data: galleries } = await supabase
          .from('galleries')
          .select(`
            *,
            client:clients(name),
            photos(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Fetch first photo for each gallery using a more efficient query
        const galleryIds = (galleries || []).map((g: any) => g.id)
        const firstPhotoMap = new Map<string, string>()

        if (galleryIds.length > 0) {
          // Use a subquery-like approach: fetch photos with LIMIT 1 per gallery
          for (const galleryId of galleryIds) {
            const { data: firstPhoto } = await supabase
              .from('photos')
              .select('preview_url')
              .eq('gallery_id', galleryId)
              .order('sort_order', { ascending: true })
              .limit(1)
              .maybeSingle()

            const typedPhoto = firstPhoto as { preview_url: string | null } | null
            if (typedPhoto && typedPhoto.preview_url) {
              firstPhotoMap.set(galleryId, typedPhoto.preview_url)
            }
          }
        }

        // Transform the data to match the expected format
        const transformedGalleries = (galleries || []).map((gallery: any) => ({
          ...gallery,
          client: gallery.client,
          photo_count: gallery.photos?.[0]?.count || 0,
          first_photo_url: firstPhotoMap.get(gallery.id) || null,
        }))

        // Sign preview URLs using server action
        const allPreviewUrls = transformedGalleries
          .map((g) => g.first_photo_url)
          .filter((url): url is string => url !== null)

        let galleriesWithSignedUrls = transformedGalleries
        if (allPreviewUrls.length > 0) {
          try {
            const signedUrls = await signPreviewUrls(allPreviewUrls)
            galleriesWithSignedUrls = transformedGalleries.map((gallery) => ({
              ...gallery,
              first_photo_url: gallery.first_photo_url ? (signedUrls[gallery.first_photo_url] || gallery.first_photo_url) : null,
            }))
          } catch (error) {
            console.warn('Failed to sign preview URLs:', error)
          }
        }

        setRecentGalleries(galleriesWithSignedUrls)
      }
      setLoading(false)
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

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">
            כל הגלריות
          </h1>
          <p className="text-sm text-[--muted]">
            {recentGalleries.length} גלריות סה״כ
          </p>
        </div>
        <Button 
          asChild 
          className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] shadow-lg shadow-[#7D3A52]/20 px-6 py-3 text-base font-semibold"
        >
          <Link href="/dashboard/galleries/new">
            <Plus className="h-5 w-5 ml-2" />
            גלריה חדשה
          </Link>
        </Button>
      </header>

      {/* Galleries Table */}
      <RecentGalleriesTable galleries={recentGalleries} title="כל הגלריות" />
    </div>
  )
}
