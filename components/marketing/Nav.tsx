import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[--border] bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5A1.5 1.5 0 0 1 9.75 4h4.5a1.5 1.5 0 0 1 1.25.75L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                fill="currentColor"
              />
              <circle cx="12" cy="13" r="3.5" fill="var(--background)" />
            </svg>
          </span>
          <span>Studio Gallery</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <Link href="#example" className="text-sm text-[--muted] hover:text-[--foreground] transition-colors">
            אתר לדוגמה
          </Link>
          <Link href="#galleries" className="text-sm text-[--muted] hover:text-[--foreground] transition-colors">
            גלריות
          </Link>
          <Link href="#pricing" className="text-sm text-[--muted] hover:text-[--foreground] transition-colors">
            חבילות שימוש
          </Link>
          <Link href="#contact" className="text-sm text-[--muted] hover:text-[--foreground] transition-colors">
            יצירת קשר
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">התחברות</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-900/20 hover:shadow-md hover:shadow-violet-900/25"
          >
            <Link href="/register">פתיחת סטודיו</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
