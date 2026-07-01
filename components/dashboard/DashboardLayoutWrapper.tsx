'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileHeader } from './MobileHeader'

type DashboardLayoutWrapperProps = {
  userName?: string
  studioName?: string
  logoUrl?: string | null
  portfolioSlug?: string | null
  onSignOut?: () => void
  children: React.ReactNode
}

export function DashboardLayoutWrapper({
  userName,
  studioName,
  logoUrl,
  portfolioSlug,
  onSignOut,
  children,
}: DashboardLayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <SidebarNav
        userName={userName}
        studioName={studioName}
        logoUrl={logoUrl}
        portfolioSlug={portfolioSlug}
        onSignOut={onSignOut}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Mobile Header */}
      <MobileHeader
        studioName={studioName}
        logoUrl={logoUrl || undefined}
      />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Main Content */}
      <main className={cn(
        "p-4 md:p-10 min-h-screen pt-20 md:pt-10 pb-24 md:pb-10 transition-all duration-300 ease-in-out bg-white",
        isSidebarCollapsed ? "md:mr-16" : "md:mr-72"
      )}>
        {children}
      </main>
    </div>
  )
}
