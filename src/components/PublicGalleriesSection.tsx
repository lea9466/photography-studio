import Link from 'next/link'
import type { GalleryCard } from '@/lib/public-galleries'
import { tenantHashPath, tenantPath, tenantQueryHashPath } from '@/lib/tenant-paths'

type Props = {
  galleries: GalleryCard[]
  photographerSlug: string
  sectionId?: string
  showContactCta?: boolean
  className?: string
  titleAs?: 'h1' | 'h2'
}

export default function PublicGalleriesSection({
  galleries,
  photographerSlug,
  sectionId,
  showContactCta = false,
  className = '',
  titleAs = 'h2',
}: Props) {
  const TitleTag = titleAs
  const Tag = sectionId ? 'section' : 'div'

  return (
    <Tag
      {...(sectionId ? { id: sectionId } : {})}
      className={`home-galleries-section scroll-mt-24 bg-background px-[5vw] py-32 md:scroll-mt-28 ${className}`.trim()}
      dir="rtl"
    >
      <div className="mx-auto w-full">
        <div className="mb-20 text-center">
          <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.4em]">
            גלריות
          </p>
          <TitleTag className="font-display text-4xl text-foreground md:text-6xl">
            בחרו את הרגע שלכם
          </TitleTag>
        </div>

        {galleries.length === 0 ? (
          <p className="text-center text-muted-foreground">
            אין גלריות פעילות כרגע. באדמין צרו גלריה וסמנו סטטוס &quot;פעיל&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {galleries.slice(0, 6).map((gallery) => (
              <Link
                key={gallery.id}
                href={tenantPath(photographerSlug, `/gallery/${gallery.id}`)}
                aria-label={`פתיחת הגלריה ${gallery.title}`}
                className="theme-gallery-card theme-shaped group relative block aspect-[3/4] overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery.cover}
                  alt={gallery.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-100" />
                {gallery.count > 1 ? (
                  <span className="absolute right-5 top-5 rounded-full bg-background/85 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
                    {gallery.count} תמונות
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-8 text-background">
                  <p className="text-[10px] uppercase tracking-[0.4em] opacity-80">סדרה</p>
                  <h3 className="mt-2 font-display text-3xl">{gallery.title}</h3>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                    <span className="transition-transform duration-500 group-hover:-translate-x-1">
                      ←
                    </span>
                    לצפייה
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showContactCta ? (
          <div className="mt-20 text-center">
            <Link
              href={tenantQueryHashPath(photographerSlug, { source: 'gallery' }, '#contact')}
              className="theme-cta-primary theme-cta-pill inline-flex items-center gap-3 bg-foreground px-10 py-4 text-sm uppercase tracking-[0.2em] text-background transition-all duration-500 hover:bg-foreground/85"
            >
              לתיאום צילום
            </Link>
          </div>
        ) : null}
      </div>
    </Tag>
  )
}
