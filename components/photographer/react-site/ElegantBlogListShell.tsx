import { ElegantPageChrome } from './ElegantPageChrome'
import type { ElegantSiteHeaderProps } from '@/components/photographer/site-chrome/ElegantSiteHeader'
import type { ElegantSiteFooterProps } from '@/components/photographer/site-chrome/ElegantSiteFooter'
import { ElegantBlogListPage, type ElegantBlogListPageProps } from '@/components/photographer/themes/elegant/ElegantBlogListPage'

export type ElegantBlogListShellProps = {
  headerProps: ElegantSiteHeaderProps
  footerProps: ElegantSiteFooterProps
  pageProps: Omit<ElegantBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

export function ElegantBlogListShell({ headerProps, footerProps, pageProps, blogPath }: ElegantBlogListShellProps) {
  return (
    <ElegantPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ElegantBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
    </ElegantPageChrome>
  )
}
