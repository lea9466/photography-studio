import { ClassicPageChrome } from './ClassicPageChrome'
import type { ClassicSiteHeaderProps } from '@/components/photographer/site-chrome/ClassicSiteHeader'
import type { ClassicSiteFooterProps } from '@/components/photographer/site-chrome/ClassicSiteFooter'
import { ClassicBeforeAfterPage, type ClassicBeforeAfterPageProps } from '@/components/photographer/themes/classic/ClassicBeforeAfterPage'

export type ClassicBeforeAfterShellProps = {
  headerProps: ClassicSiteHeaderProps
  footerProps: ClassicSiteFooterProps
  pageProps: ClassicBeforeAfterPageProps
}

export function ClassicBeforeAfterShell({ headerProps, footerProps, pageProps }: ClassicBeforeAfterShellProps) {
  return (
    <ClassicPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ClassicBeforeAfterPage {...pageProps} />
    </ClassicPageChrome>
  )
}
