import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { DarkBeforeAfterPage, type DarkBeforeAfterPageProps } from '@/components/photographer/themes/dark/DarkBeforeAfterPage'

export type DarkBeforeAfterShellProps = {
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  pageProps: DarkBeforeAfterPageProps
}

export function DarkBeforeAfterShell({ headerProps, footerProps, pageProps }: DarkBeforeAfterShellProps) {
  return (
    <DarkPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkBeforeAfterPage {...pageProps} />
    </DarkPageChrome>
  )
}
