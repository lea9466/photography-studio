import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import {
  ClassicGalleryDetailPage,
  type ClassicGalleryDetailPageProps,
} from '@/components/photographer/themes/classic/ClassicGalleryDetailPage'

export type ClassicGalleryDetailShellProps = {
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  pageProps: ClassicGalleryDetailPageProps
}

export function ClassicGalleryDetailShell({ headerProps, footerProps, pageProps }: ClassicGalleryDetailShellProps) {
  return (
    <ClassicPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicGalleryDetailPage {...pageProps} />
    </ClassicPageChrome>
  )
}
