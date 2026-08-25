import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import {
  DarkGalleryDetailPage,
  type DarkGalleryDetailPageProps,
} from '@/components/photographer/themes/dark/DarkGalleryDetailPage'

export type DarkGalleryDetailShellProps = {
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  pageProps: DarkGalleryDetailPageProps
}

export function DarkGalleryDetailShell({ headerProps, footerProps, pageProps }: DarkGalleryDetailShellProps) {
  return (
    <DarkPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkGalleryDetailPage {...pageProps} />
    </DarkPageChrome>
  )
}
