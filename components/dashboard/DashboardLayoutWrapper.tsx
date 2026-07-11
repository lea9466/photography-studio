'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'
import { MobileHeader } from './MobileHeader'
import { ImpersonationBanner } from './ImpersonationBanner'
import { AnnouncementBanner } from './AnnouncementBanner'
import { ReferralSuccessModal } from './ReferralSuccessModal'
import { WelcomeModal } from './WelcomeModal'
import type { Announcement } from '@/lib/announcements/types'

type DashboardLayoutWrapperProps = {
  userName?: string
  studioName?: string
  logoUrl?: string | null
  portfolioSlug?: string | null
  showReferralPopup?: boolean
  showWelcomePopup?: boolean
  welcomePreviewUrl?: string | null
  onSignOut?: () => void
  children: React.ReactNode
  accentColor?: string
  shouldColorLogo?: boolean
  isImpersonating?: boolean
  announcement?: Announcement | null
}

export function DashboardLayoutWrapper({
  userName,
  studioName,
  logoUrl,
  portfolioSlug,
  showReferralPopup = false,
  showWelcomePopup = false,
  welcomePreviewUrl = null,
  onSignOut,
  children,
  accentColor,
  shouldColorLogo,
  isImpersonating = false,
  announcement = null,
}: DashboardLayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen">
      {isImpersonating ? <ImpersonationBanner studioName={studioName} /> : null}
      <WelcomeModal open={showWelcomePopup} previewUrl={welcomePreviewUrl} />
      <ReferralSuccessModal open={showReferralPopup} />
      <SidebarNav
        userName={userName}
        studioName={studioName}
        logoUrl={logoUrl}
        portfolioSlug={portfolioSlug}
        onSignOut={onSignOut}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={closeMobileMenu}
        accentColor={accentColor}
        shouldColorLogo={shouldColorLogo}
      />

      <MobileHeader
        studioName={studioName}
        logoUrl={logoUrl || undefined}
        accentColor={accentColor}
        shouldColorLogo={shouldColorLogo}
        isMenuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen((open) => !open)}
      />

      {/* Main Content */}
      <main className={cn(
        'p-4 md:p-10 min-h-screen transition-all duration-300 ease-in-out bg-white',
        isImpersonating ? 'pt-28 md:pt-16' : 'pt-20 md:pt-10',
        isSidebarCollapsed ? 'md:mr-16' : 'md:mr-72'
      )}>
        <AnnouncementBanner
          announcement={announcement}
          accentColor={accentColor}
        />
        {children}
      </main>
    </div>
  )
}
