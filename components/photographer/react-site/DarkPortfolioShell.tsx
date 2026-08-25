import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { DarkPortfolioPage, type DarkPortfolioPageProps } from '@/components/photographer/themes/dark/DarkPortfolioPage'

export type DarkPortfolioShellProps = {
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  pageProps: DarkPortfolioPageProps
}

export function DarkPortfolioShell({ headerProps, footerProps, pageProps }: DarkPortfolioShellProps) {
  return (
    <DarkPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkPortfolioPage {...pageProps} />
    </DarkPageChrome>
  )
}
