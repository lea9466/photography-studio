'use client'

import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MobileHeaderProps = {
  studioName?: string
}

export function MobileHeader({ studioName }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex justify-between items-center w-full px-4 py-3 bg-[--background] fixed top-0 z-50 border-b border-[--border]/30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-[18px] font-bold text-[--foreground] leading-tight">
            {studioName || 'Studio Gallery'}
          </h1>
          <span className="text-[10px] text-[--muted] uppercase tracking-wider">
            ניהול סטודיו
          </span>
        </div>
      </div>
      <Button 
        asChild
        className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform flex items-center gap-1"
      >
        <Link href="/dashboard/galleries/new">
          <Plus className="h-4 w-4" />
          חדש
        </Link>
      </Button>
    </header>
  )
}
