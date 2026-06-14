import Link from 'next/link'
import { fetchClients } from '@/lib/actions/client.actions'
import { GalleryWizard } from '@/components/gallery/GalleryWizard'
import { Button } from '@/components/ui/button'

export default async function NewGalleryPage() {
  const clients = await fetchClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">גלריה חדשה</h1>
          <p className="mt-1 text-sm text-[--muted]">
            4 שלבים — לקוח, סוג, תמונות, פרסום
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">ביטול</Link>
        </Button>
      </div>

      <GalleryWizard clients={clients} />
    </div>
  )
}
