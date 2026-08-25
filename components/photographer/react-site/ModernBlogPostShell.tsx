import { ModernPageChrome } from './ModernPageChrome'
import type { ModernSiteHeaderProps } from '@/components/photographer/site-chrome/ModernSiteHeader'
import type { ModernSiteFooterProps } from '@/components/photographer/site-chrome/ModernSiteFooter'
import { ModernBlogPostPage, type ModernBlogPostPageProps } from '@/components/photographer/themes/modern/ModernBlogPostPage'

export type ModernBlogPostShellProps = {
  headerProps: ModernSiteHeaderProps
  footerProps: ModernSiteFooterProps
  pageProps: ModernBlogPostPageProps
}

export function ModernBlogPostShell({ headerProps, footerProps, pageProps }: ModernBlogPostShellProps) {
  return (
    <ModernPageChrome language={pageProps.language} headerProps={headerProps} footerProps={footerProps}>
      <ModernBlogPostPage {...pageProps} />
    </ModernPageChrome>
  )
}
