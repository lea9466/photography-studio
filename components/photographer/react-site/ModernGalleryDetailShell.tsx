import {
  ModernGalleryDetailPage,
  type ModernGalleryDetailPageProps,
} from '@/components/photographer/themes/modern/ModernGalleryDetailPage'

export type ModernGalleryDetailShellProps = {
  pageProps: ModernGalleryDetailPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ModernGalleryDetailShell({ pageProps }: ModernGalleryDetailShellProps) {
  return <ModernGalleryDetailPage {...pageProps} />
}
