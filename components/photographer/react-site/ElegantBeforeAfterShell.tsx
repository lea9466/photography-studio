import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { ElegantBeforeAfterPage, type ElegantBeforeAfterPageProps } from '@/components/photographer/themes/elegant/ElegantBeforeAfterPage'

export type ElegantBeforeAfterShellProps = {
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  pageProps: ElegantBeforeAfterPageProps
}

export function ElegantBeforeAfterShell({ headerProps, footerProps, pageProps }: ElegantBeforeAfterShellProps) {
  return (
    <ElegantPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantBeforeAfterPage {...pageProps} />
    </ElegantPageChrome>
  )
}
