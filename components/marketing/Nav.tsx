import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Nav() {
  return (
    <header className="border-b border-[--border]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          Studio Gallery
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">התחברות</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">פתיחת סטודיו</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
