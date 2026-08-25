import { DarkPageChrome } from './DarkPageChrome'
import type { DarkSiteHeaderProps } from '@/components/photographer/site-chrome/DarkSiteHeader'
import type { DarkSiteFooterProps } from '@/components/photographer/site-chrome/DarkSiteFooter'
import { DarkBlogPostPage, type DarkBlogPostPageProps } from '@/components/photographer/themes/dark/DarkBlogPostPage'

export type DarkBlogPostShellProps = {
  headerProps: DarkSiteHeaderProps
  footerProps: DarkSiteFooterProps
  pageProps: DarkBlogPostPageProps
}

export function DarkBlogPostShell({ headerProps, footerProps, pageProps }: DarkBlogPostShellProps) {
  return (
    <DarkPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <DarkBlogPostPage {...pageProps} />
    </DarkPageChrome>
  )
}
