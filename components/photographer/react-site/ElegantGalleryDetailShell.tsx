import {
  ElegantGalleryDetailPage,
  type ElegantGalleryDetailPageProps,
} from '@/components/photographer/themes/elegant/ElegantGalleryDetailPage'

export type ElegantGalleryDetailShellProps = {
  pageProps: ElegantGalleryDetailPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ElegantGalleryDetailShell({ pageProps }: ElegantGalleryDetailShellProps) {
  return <ElegantGalleryDetailPage {...pageProps} />
}
