import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { ElegantBlogPostPage, type ElegantBlogPostPageProps } from '@/components/photographer/themes/elegant/ElegantBlogPostPage'

export type ElegantBlogPostShellProps = {
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  pageProps: ElegantBlogPostPageProps
}

export function ElegantBlogPostShell({ headerProps, footerProps, pageProps }: ElegantBlogPostShellProps) {
  return (
    <ElegantPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantBlogPostPage {...pageProps} />
    </ElegantPageChrome>
  )
}
