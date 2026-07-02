'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-[--background] border-b border-[--border]' : 'bg-transparent border-none'
    }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          Studio Gallery
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#contact" className="text-sm hover:text-[--primary] transition-colors">
            יצירת קשר
          </Link>
          <Link href="#pricing" className="text-sm hover:text-[--primary] transition-colors">
            חבילות צילום
          </Link>
          <Link href="#galleries" className="text-sm hover:text-[--primary] transition-colors">
            גלריות
          </Link>
          <Link href="/" className="text-sm hover:text-[--primary] transition-colors">
            בית
          </Link>
        </nav>
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
