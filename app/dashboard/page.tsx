import Link from 'next/link'
import { Plus } from 'lucide-react'
import { fetchDashboardGalleries } from '@/lib/db'
import { GalleryCard } from '@/components/dashboard/GalleryCard'
import { StatusFilter } from '@/components/dashboard/StatusFilter'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { GalleryStatusFilter } from '@/lib/types/app.types'
import type { GalleryStatus } from '@/lib/types/database.types'

type DashboardPageProps = {
  searchParams: Promise<{ status?: string }>
}

function parseStatusFilter(status?: string): GalleryStatusFilter {
  const valid: GalleryStatus[] = [
    'draft',
    'sent',
    'selection',
    'editing',
    'delivery_ready',
    'locked',
  ]
  if (status && valid.includes(status as GalleryStatus)) {
    return status as GalleryStatus
  }
  return 'all'
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { status } = await searchParams
  const statusFilter = parseStatusFilter(status)
  const galleries = await fetchDashboardGalleries(statusFilter)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">הגלריות שלי</h1>
          <p className="mt-1 text-sm text-[--muted]">
            {galleries.length} גלריות
            {statusFilter !== 'all' ? ' במסנן הנוכחי' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/galleries/new">
            <Plus className="h-4 w-4" />
            גלריה חדשה
          </Link>
        </Button>
      </div>

      <StatusFilter current={statusFilter} />

      {galleries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>אין גלריות עדיין</CardTitle>
            <CardDescription>
              צרי את הגלריה הראשונה שלך — 4 שלבים פשוטים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/galleries/new">
                <Plus className="h-4 w-4" />
                גלריה חדשה
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </div>
  )
}
