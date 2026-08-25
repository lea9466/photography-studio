import { ModernBeforeAfterPage, type ModernBeforeAfterPageProps } from '@/components/photographer/themes/modern/ModernBeforeAfterPage'

export type ModernBeforeAfterShellProps = {
  pageProps: ModernBeforeAfterPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ModernBeforeAfterShell({ pageProps }: ModernBeforeAfterShellProps) {
  return <ModernBeforeAfterPage {...pageProps} />
}
