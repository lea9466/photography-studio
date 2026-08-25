import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { ClassicPortfolioPage, type ClassicPortfolioPageProps } from '@/components/photographer/themes/classic/ClassicPortfolioPage'

export type ClassicPortfolioShellProps = {
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  pageProps: ClassicPortfolioPageProps
}

export function ClassicPortfolioShell({ headerProps, footerProps, pageProps }: ClassicPortfolioShellProps) {
  return (
    <ClassicPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicPortfolioPage {...pageProps} />
    </ClassicPageChrome>
  )
}
