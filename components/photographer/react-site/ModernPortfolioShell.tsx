import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { ModernPortfolioPage, type ModernPortfolioPageProps } from '@/components/photographer/themes/modern/ModernPortfolioPage'

export type ModernPortfolioShellProps = {
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  pageProps: ModernPortfolioPageProps
}

export function ModernPortfolioShell({ headerProps, footerProps, pageProps }: ModernPortfolioShellProps) {
  return (
    <ModernPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernPortfolioPage {...pageProps} />
    </ModernPageChrome>
  )
}
