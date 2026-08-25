import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { ModernBeforeAfterPage, type ModernBeforeAfterPageProps } from '@/components/photographer/themes/modern/ModernBeforeAfterPage'

export type ModernBeforeAfterShellProps = {
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  pageProps: ModernBeforeAfterPageProps
}

export function ModernBeforeAfterShell({ headerProps, footerProps, pageProps }: ModernBeforeAfterShellProps) {
  return (
    <ModernPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernBeforeAfterPage {...pageProps} />
    </ModernPageChrome>
  )
}
