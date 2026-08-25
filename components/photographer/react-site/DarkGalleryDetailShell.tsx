import {
  DarkGalleryDetailPage,
  type DarkGalleryDetailPageProps,
} from '@/components/photographer/themes/dark/DarkGalleryDetailPage'

export type DarkGalleryDetailShellProps = {
  pageProps: DarkGalleryDetailPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function DarkGalleryDetailShell({ pageProps }: DarkGalleryDetailShellProps) {
  return <DarkGalleryDetailPage {...pageProps} />
}
