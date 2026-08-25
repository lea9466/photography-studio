import { DarkBeforeAfterPage, type DarkBeforeAfterPageProps } from '@/components/photographer/themes/dark/DarkBeforeAfterPage'

export type DarkBeforeAfterShellProps = {
  pageProps: DarkBeforeAfterPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function DarkBeforeAfterShell({ pageProps }: DarkBeforeAfterShellProps) {
  return <DarkBeforeAfterPage {...pageProps} />
}
