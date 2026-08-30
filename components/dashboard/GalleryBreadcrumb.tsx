import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type GalleryBreadcrumbProps = {
  galleryTitle: string
  backHref?: string
  backLabel?: string
}

export function GalleryBreadcrumb({
  galleryTitle,
  backHref = '/dashboard/galleries',
  backLabel = 'הגלריות שלי',
}: GalleryBreadcrumbProps) {
  return (
    <nav aria-label="מיקום בדשבורד" className="flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href={backHref}
        className="text-[--muted] transition-colors hover:text-[--foreground]"
      >
        {backLabel}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-[--muted]" aria-hidden />
      <span className="font-medium text-[--foreground]">{galleryTitle}</span>
    </nav>
  )
}
