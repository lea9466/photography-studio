import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import {
  ElegantGalleryDetailPage,
  type ElegantGalleryDetailPageProps,
} from '@/components/photographer/themes/elegant/ElegantGalleryDetailPage'

export type ElegantGalleryDetailShellProps = {
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  pageProps: ElegantGalleryDetailPageProps
}

export function ElegantGalleryDetailShell({ headerProps, footerProps, pageProps }: ElegantGalleryDetailShellProps) {
  return (
    <ElegantPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantGalleryDetailPage {...pageProps} />
    </ElegantPageChrome>
  )
}
