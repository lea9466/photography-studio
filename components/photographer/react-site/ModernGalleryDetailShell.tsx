import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import {
  ModernGalleryDetailPage,
  type ModernGalleryDetailPageProps,
} from '@/components/photographer/themes/modern/ModernGalleryDetailPage'

export type ModernGalleryDetailShellProps = {
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  pageProps: ModernGalleryDetailPageProps
}

export function ModernGalleryDetailShell({ headerProps, footerProps, pageProps }: ModernGalleryDetailShellProps) {
  return (
    <ModernPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernGalleryDetailPage {...pageProps} />
    </ModernPageChrome>
  )
}
