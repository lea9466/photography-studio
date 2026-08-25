import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { ModernBlogListPage, type ModernBlogListPageProps } from '@/components/photographer/themes/modern/ModernBlogListPage'

export type ModernBlogListShellProps = {
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  pageProps: Omit<ModernBlogListPageProps, 'hrefForPost'>
  /** Base path to build each post card's link from, e.g. "/studio/blog". */
  blogPath: string
}

export function ModernBlogListShell({ headerProps, footerProps, pageProps, blogPath }: ModernBlogListShellProps) {
  return (
    <ModernPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
    </ModernPageChrome>
  )
}
