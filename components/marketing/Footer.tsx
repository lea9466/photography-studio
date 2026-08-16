import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[--border] px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-gradient-to-br from-violet-600 to-violet-800 text-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5A1.5 1.5 0 0 1 9.75 4h4.5a1.5 1.5 0 0 1 1.25.75L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                fill="currentColor"
              />
              <circle cx="12" cy="13" r="3.5" fill="var(--background)" />
            </svg>
          </span>
          Studio Gallery
        </Link>
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
          <Link
            href="/terms"
            className="text-[--muted] underline-offset-4 transition-colors hover:text-[--foreground] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--accent]"
          >
            תקנון ותנאי שימוש
          </Link>
        </nav>
        <p className="text-sm text-[--muted]">© כל הזכויות שמורות {year} Studio Gallery</p>
      </div>
    </footer>
  )
}
