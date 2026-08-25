import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { DarkBlogListPage, type DarkBlogListPageProps } from '@/components/photographer/themes/dark/DarkBlogListPage'

export type DarkBlogListShellProps = {
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  pageProps: Omit<DarkBlogListPageProps, 'hrefForPost'>
  blogPath: string
}

export function DarkBlogListShell({ headerProps, footerProps, pageProps, blogPath }: DarkBlogListShellProps) {
  return (
    <DarkPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkBlogListPage {...pageProps} hrefForPost={(postId) => `${blogPath}/${postId}`} />
    </DarkPageChrome>
  )
}
