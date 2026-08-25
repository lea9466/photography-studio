import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { ElegantPortfolioPage, type ElegantPortfolioPageProps } from '@/components/photographer/themes/elegant/ElegantPortfolioPage'

export type ElegantPortfolioShellProps = {
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  pageProps: ElegantPortfolioPageProps
}

export function ElegantPortfolioShell({ headerProps, footerProps, pageProps }: ElegantPortfolioShellProps) {
  return (
    <ElegantPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantPortfolioPage {...pageProps} />
    </ElegantPageChrome>
  )
}
