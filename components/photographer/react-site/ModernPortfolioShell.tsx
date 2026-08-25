import { ModernPortfolioPage, type ModernPortfolioPageProps } from '@/components/photographer/themes/modern/ModernPortfolioPage'

export type ModernPortfolioShellProps = {
  pageProps: ModernPortfolioPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ModernPortfolioShell({ pageProps }: ModernPortfolioShellProps) {
  return <ModernPortfolioPage {...pageProps} />
}
