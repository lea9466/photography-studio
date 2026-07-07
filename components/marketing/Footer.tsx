import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[--border] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4">
        <nav
          aria-label="קישורים משפטיים"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
        >
          <Link
            href="/accessibility"
            className="text-[--muted] underline-offset-4 transition-colors hover:text-[--foreground] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
          >
            הצהרת נגישות
          </Link>
          <Link
            href="/privacy"
            className="text-[--muted] underline-offset-4 transition-colors hover:text-[--foreground] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
          >
            מדיניות פרטיות
          </Link>
        </nav>
        <div className="flex w-full flex-col items-center justify-between gap-2 text-sm text-[--muted] sm:flex-row">
          <span>Studio Gallery</span>
          <span>© כל הזכויות שמורות {year}</span>
        </div>
      </div>
    </footer>
  )
}
