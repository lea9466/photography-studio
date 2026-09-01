'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Building2,
  CreditCard,
  LogOut,
  Mail,
  Megaphone,
  Settings2,
  Wrench,
} from 'lucide-react'

import type { AdminCustomDomainRow, AdminStudioRow } from '@/lib/admin/queries'
import { adminLogout } from '@/lib/actions/admin.actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { AdminStudioList } from '@/components/admin/AdminStudioList'
import { AnnouncementManagerForm } from '@/components/admin/AnnouncementManagerForm'
import { AdminBroadcastForm } from '@/components/admin/AdminBroadcastForm'
import { AdminCoverCardMaintenance } from '@/components/admin/AdminCoverCardMaintenance'
import { AdminGalleryOriginalsCleanup } from '@/components/admin/AdminGalleryOriginalsCleanup'
import { PlanPricingManager } from '@/components/admin/PlanPricingManager'
import { PrivateGalleryTiersManager } from '@/components/admin/PrivateGalleryTiersManager'
import { ReactPublicSiteToggle } from '@/components/admin/ReactPublicSiteToggle'
import { CustomDomainVerificationManager } from '@/components/admin/CustomDomainVerificationManager'

type ManageTabsProps = {
  studios: AdminStudioRow[]
  appBaseUrl: string
  customDomains: AdminCustomDomainRow[]
  reactPublicSiteEnabled: boolean
}

const TABS = [
  { id: 'studios', label: 'סטודיואים', icon: Building2 },
  { id: 'announcement', label: 'הודעת דשבורד', icon: Megaphone },
  { id: 'broadcast', label: 'דיוור במייל', icon: Mail },
  { id: 'maintenance', label: 'תחזוקת מדיה', icon: Wrench },
  { id: 'pricing', label: 'מסלולים ותמחור', icon: CreditCard },
  { id: 'system', label: 'הגדרות מערכת', icon: Settings2 },
] as const

type TabId = (typeof TABS)[number]['id']

function isTabId(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value)
}

export function ManageTabs({
  studios,
  appBaseUrl,
  customDomains,
  reactPublicSiteEnabled,
}: ManageTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('studios')
  const [logoutPending, startLogout] = useTransition()

  // Restore the last-opened tab from the URL hash so a refresh (or a shared
  // link) lands back on the same section instead of always resetting to the
  // studios list.
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '')
    if (isTabId(fromHash)) setActiveTab(fromHash)
  }, [])

  function selectTab(id: TabId) {
    setActiveTab(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  function handleLogout() {
    startLogout(async () => {
      await adminLogout()
      window.location.reload()
    })
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sticky top-0 z-30 -mx-3 border-b border-slate-200/80 bg-slate-100/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="אזורי ניהול"
            className="flex flex-wrap gap-1.5"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all',
                    active
                      ? 'border-slate-300 bg-slate-800 text-white shadow-md shadow-slate-800/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={logoutPending}
            className="shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            {logoutPending ? 'יוצא...' : 'יציאה'}
          </Button>
        </div>
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'studios' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <AdminStudioList studios={studios} appBaseUrl={appBaseUrl} />
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'announcement' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <AnnouncementManagerForm />
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'broadcast' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <AdminBroadcastForm />
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'maintenance' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <AdminCoverCardMaintenance />
        <AdminGalleryOriginalsCleanup />
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'pricing' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <PlanPricingManager />
        <PrivateGalleryTiersManager />
      </div>

      <div
        role="tabpanel"
        className={activeTab === 'system' ? 'flex flex-col gap-6' : 'hidden'}
      >
        <ReactPublicSiteToggle initialEnabled={reactPublicSiteEnabled} />
        <CustomDomainVerificationManager domains={customDomains} />
      </div>
    </div>
  )
}
