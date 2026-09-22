import { ClientGalleryHero } from '@/components/gallery/ClientGalleryHero'
import type { ClientPageAccent } from '@/lib/branding/client-page-colors'
import type { ClientPageHeroStyle } from '@/lib/branding/client-page-hero-style'
import { clientPageDataTheme, type ClientPageBackground } from '@/lib/branding/client-page-background'

type ClientPagePreviewProps = {
  studioName: string | null
  accent: ClientPageAccent
  /** The logo as it will show — a saved URL or a blob URL of a file not saved yet. */
  logoUrl: string | null
  heroStyle: ClientPageHeroStyle
  background: ClientPageBackground
}

/**
 * A miniature of the top of the client page, rendered by the very components the
 * client sees, so the preview can't drift from the real thing. Purely visual —
 * hidden from assistive tech so its heading doesn't compete with the page's own.
 */
export function ClientPagePreview({
  studioName,
  accent,
  logoUrl,
  heroStyle,
  background,
}: ClientPagePreviewProps) {
  return (
    <div
      aria-hidden="true"
      data-theme={clientPageDataTheme(background)}
      className="overflow-hidden rounded-xl border border-border bg-background"
      style={
        {
          '--client-accent': accent.accent,
          '--client-accent-fg': accent.foreground,
        } as React.CSSProperties
      }
    >
      <ClientGalleryHero
        title="שם הגלריה שלך"
        studioName={studioName}
        logoUrl={logoUrl}
        coverUrl={null}
        heroStyle={heroStyle}
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg">
          תמונות רגילות
        </span>
        <span className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">
          סיימתי לבחור ✓
        </span>
      </div>
    </div>
  )
}
