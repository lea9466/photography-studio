'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'
import { MobileHeader } from './MobileHeader'
import { ImpersonationBanner } from './ImpersonationBanner'
import { AnnouncementBanner } from './AnnouncementBanner'
import { ReferralSuccessModal } from './ReferralSuccessModal'
import { WelcomeModal } from './WelcomeModal'
import { AssistantWidget } from './assistant/AssistantWidget'
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
  siteUnavailableLocked?: boolean
  isUnderConstruction?: boolean
  announcement?: Announcement | null
  isPro?: boolean
  assistantHasMissingContent?: boolean
  assistantMissingSlug?: boolean
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
  siteUnavailableLocked = false,
  isUnderConstruction = false,
  announcement = null,
  isPro = true,
  assistantHasMissingContent = false,
  assistantMissingSlug = false,
}: DashboardLayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantHidden, setAssistantHidden] = useState(false)

  useEffect(() => {
    setAssistantHidden(localStorage.getItem('assistant-widget-hidden') === '1')
  }, [])

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  function dismissAssistant() {
    setAssistantOpen(false)
    setAssistantHidden(true)
    localStorage.setItem('assistant-widget-hidden', '1')
  }

  function openAssistant() {
    setAssistantHidden(false)
    localStorage.removeItem('assistant-widget-hidden')
    setAssistantOpen(true)
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
        siteUnavailableLocked={siteUnavailableLocked}
        isUnderConstruction={isUnderConstruction}
        isPro={isPro}
        onOpenAssistant={siteUnavailableLocked ? undefined : openAssistant}
        assistantHasMissingContent={assistantHasMissingContent}
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

      {!siteUnavailableLocked && !assistantHidden ? (
        <AssistantWidget
          hasMissingContent={assistantHasMissingContent}
          missingSlug={assistantMissingSlug}
          open={assistantOpen}
          onOpenChange={setAssistantOpen}
          onDismiss={dismissAssistant}
        />
      ) : null}
    </div>
  )
}
