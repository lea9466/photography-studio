import {
  ClassicGalleryDetailPage,
  type ClassicGalleryDetailPageProps,
} from '@/components/photographer/themes/classic/ClassicGalleryDetailPage'

export type ClassicGalleryDetailShellProps = {
  pageProps: ClassicGalleryDetailPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ClassicGalleryDetailShell({ pageProps }: ClassicGalleryDetailShellProps) {
  return <ClassicGalleryDetailPage {...pageProps} />
}
