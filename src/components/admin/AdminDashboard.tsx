'use client'

import { useState } from 'react'
import type { AlbumWithClient, ClientWithUser } from '@/lib/admin-db'
import type {
  ClientsRow,
  ImagesRow,
  PackagesRow,
  SiteSettingsRow,
} from '@/lib/database.types'
import { parseThemeStyle } from '@/lib/theme-styles'
import ClientsPanel from './ClientsPanel'
import GalleriesPanel from './GalleriesPanel'
import PackagesPanel from './PackagesPanel'
import SiteSettingsForm from './SiteSettingsForm'
import TestimonialsPanel from './TestimonialsPanel'
import type { TestimonialWithClient } from '@/lib/testimonials-db'

export type AdminTab =
  | 'settings'
  | 'galleries'
  | 'clients'
  | 'packages'
  | 'testimonials'

const TABS: {
  id: AdminTab
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: 'settings',
    label: 'הגדרות אתר',
    description: 'שם, יצירת קשר, תמונות ועיצוב',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'galleries',
    label: 'גלריות',
    description: 'הוספה, עריכה והעלאת תמונות',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'לקוחות',
    description: 'ניהול לקוחות וגישה לאזור האישי',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 'packages',
    label: 'תמחורים',
    description: 'חבילות שמוצגות בדף המחירון',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'testimonials',
    label: 'המלצות',
    description: 'אישור המלצות לקוחות לפרסום באתר',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
]

export default function AdminDashboard({
  settings,
  albums,
  clients,
  clientOptions,
  imagesByAlbum,
  selectionsByImage,
  packages,
  testimonials,
  configured,
  configMessage,
  r2Ready,
  r2Message,
  initialTab = 'settings',
}: {
  settings: SiteSettingsRow | null
  albums: AlbumWithClient[]
  clients: ClientWithUser[]
  clientOptions: Pick<ClientsRow, 'id' | 'full_name'>[]
  imagesByAlbum: Record<string, ImagesRow[]>
  selectionsByImage: Record<string, string[]>
  packages: PackagesRow[]
  testimonials: TestimonialWithClient[]
  configured: boolean
  configMessage: string
  r2Ready: boolean
  r2Message: string
  initialTab?: AdminTab
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab)
  const theme = parseThemeStyle(settings?.theme_style)
  const activeTab = TABS.find((t) => t.id === tab)!

  return (
    <div className="w-full">
      {!configured ? (
        <div
          role="alert"
          className="admin-card mb-8 border-amber-200/80 bg-amber-50/50 p-5 text-sm text-amber-950"
        >
          <p className="font-medium">נדרשת הגדרה לפני שמירה</p>
          <p className="mt-2 leading-relaxed opacity-80">{configMessage}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav
          className="lg:sticky lg:top-8 lg:w-64 lg:shrink-0"
          aria-label="אזורי ניהול"
        >
          <div className="admin-card p-2">
            <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {TABS.map((t) => {
                const active = tab === t.id
                return (
                  <li key={t.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition-all ${
                        active
                          ? 'admin-tab-active'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`shrink-0 ${active ? 'opacity-100' : 'opacity-50'}`}
                      >
                        {t.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{t.label}</span>
                        <span
                          className={`mt-0.5 hidden text-xs leading-snug lg:block ${
                            active ? 'opacity-75' : 'opacity-60'
                          }`}
                        >
                          {t.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <section className="min-w-0 flex-1">
          <div className="p-6 sm:p-8 lg:p-10">
            <header className="mb-8 border-b border-border pb-6">
              <h2 className="text-xl font-medium text-foreground sm:text-2xl">
                {activeTab.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {activeTab.description}
              </p>
            </header>

            <div className="space-y-8">
              {tab === 'settings' ? (
                <SiteSettingsForm settings={settings} disabled={!configured} />
              ) : null}

              {tab === 'galleries' ? (
                <GalleriesPanel
                  albums={albums}
                  clients={clientOptions}
                  imagesByAlbum={imagesByAlbum}
                  selectionsByImage={selectionsByImage}
                  disabled={!configured}
                  r2Ready={r2Ready}
                  r2Message={r2Message}
                  theme={theme}
                />
              ) : null}

              {tab === 'clients' ? (
                <ClientsPanel clients={clients} disabled={!configured} />
              ) : null}

              {tab === 'packages' ? (
                <PackagesPanel packages={packages} disabled={!configured} />
              ) : null}

              {tab === 'testimonials' ? (
                <TestimonialsPanel
                  testimonials={testimonials}
                  disabled={!configured}
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
