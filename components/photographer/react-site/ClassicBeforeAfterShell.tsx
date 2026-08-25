import { ClassicBeforeAfterPage, type ClassicBeforeAfterPageProps } from '@/components/photographer/themes/classic/ClassicBeforeAfterPage'

export type ClassicBeforeAfterShellProps = {
  pageProps: ClassicBeforeAfterPageProps
}

/** Header/footer now come from app/[slug]/layout.tsx's shared chrome — see
 * ClassicHomepageShell.tsx's doc comment for why. */
export function ClassicBeforeAfterShell({ pageProps }: ClassicBeforeAfterShellProps) {
  return <ClassicBeforeAfterPage {...pageProps} />
}
